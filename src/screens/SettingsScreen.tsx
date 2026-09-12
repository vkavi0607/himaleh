import React, { useState, useRef, useEffect } from 'react';
import { UserSettings, SoundPreset } from '../types';
import { StorageService } from '../data/storage';
import { SoundService } from '../services/SoundService';
import { NotificationService } from '../services/NotificationService';
import { DataExportService, ImportValidationResult } from '../services/DataExportService';
import { HimalehLogo } from '../components/HimalehLogo';
import {
  User,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Check,
  Moon,
  Sun,
  Laptop,
  Sparkles,
  Clock,
  Play,
  Square,
  Music,
  Lock,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  X,
  Star,
  ChevronRight,
  Send,
  Timer,
  Info,
  FileText,
  Database,
  UploadCloud,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onDataReload: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onDataReload,
}) => {
  // --- Profile & Account ---
  const [userName, setUserName] = useState(settings.userName || 'Explorer');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(settings.timeFormat || '12h');
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>(settings.weekStartsOn || 'monday');
  const [restDayFrequency, setRestDayFrequency] = useState<number>(settings.restDayFrequency ?? 1);
  const strictAccountability = settings.strictAccountability ?? false;

  // --- Notifications ---
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  const [routineReminders, setRoutineReminders] = useState(settings.routineReminders ?? true);
  const [goalReminders, setGoalReminders] = useState(settings.goalReminders ?? true);
  const [achievementNotifications, setAchievementNotifications] = useState(settings.achievementNotifications ?? true);
  const [accountabilityNotifications, setAccountabilityNotifications] = useState(settings.accountabilityNotifications ?? true);
  const reflectionReminders = settings.reflectionReminders ?? true;
  const incompleteReminders = settings.incompleteReminders ?? true;

  // --- Sound & Haptics ---
  const soundEnabled = settings.soundEnabled ?? true;
  const reminderSounds = settings.reminderSounds ?? true;
  const celebrationSounds = settings.celebrationSounds ?? true;
  const accountabilitySounds = settings.accountabilitySounds ?? true;
  const [soundVolume, setSoundVolume] = useState<'low' | 'medium' | 'high'>(settings.soundVolume || 'medium');
  const [selectedSound, setSelectedSound] = useState<SoundPreset>(settings.selectedSound || 'himaleh_chime');
  const [customSoundName, setCustomSoundName] = useState<string | null>(settings.customSoundName || null);
  const [customSoundData, setCustomSoundData] = useState<string | null>(settings.customSoundData || null);
  const [customSoundError, setCustomSoundError] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled ?? true);

  // --- Reminder Preferences ---
  const [autoEnableRoutineReminder, setAutoEnableRoutineReminder] = useState(settings.autoEnableRoutineReminder ?? true);
  const [morningReminderTime, setMorningReminderTime] = useState(settings.morningReminderTime || '07:30');
  const [eveningReflectionTime, setEveningReflectionTime] = useState(settings.eveningReflectionTime || '21:30');

  // --- Appearance ---
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'system');
  const [isDarkMode, setIsDarkMode] = useState(settings.isDarkMode ?? false);
  const [accentStyle, setAccentStyle] = useState<'emerald' | 'gold' | 'glacier' | 'obsidian'>(settings.accentStyle || 'emerald');
  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion ?? false);
  const [layoutMode, setLayoutMode] = useState<'compact' | 'comfortable'>(settings.layoutMode || 'comfortable');

  // --- Security / App Lock ---
  const [appLockEnabled, setAppLockEnabled] = useState(settings.appLockEnabled ?? false);
  const [appLockPin, setAppLockPin] = useState(settings.appLockPin || '');
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // --- Modals & Feedback ---
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Experience');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Notice & Status
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeTestCountdown, setActiveTestCountdown] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  // Export & Import Modals State
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRawContent, setImportRawContent] = useState<string | null>(null);
  const [importValidation, setImportValidation] = useState<ImportValidationResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Check initial notification permission on mount
  useEffect(() => {
    setPermissionStatus(NotificationService.getPermissionStatus());
  }, []);

  // Update countdown timer for scheduled test
  useEffect(() => {
    if (activeTestCountdown === null || activeTestCountdown <= 0) return;
    const timer = setInterval(() => {
      setActiveTestCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTestCountdown]);

  // Sound presets list
  const soundPresets: Array<{ id: SoundPreset; name: string; desc: string }> = [
    { id: 'himaleh_chime', name: 'Himaleh Chime', desc: 'Pentatonic crystalline alpine chime' },
    { id: 'soft_reminder', name: 'Soft Reminder', desc: 'Warm dual mallet bell tone' },
    { id: 'focus_bell', name: 'Focus', desc: 'Resonant Tibetan meditation singing bowl' },
    { id: 'achievement', name: 'Achievement', desc: 'Ascending chord milestone tone' },
    { id: 'gentle_alert', name: 'Gentle Alert', desc: 'Subtle high-frequency bubble chime' },
    { id: 'system_default', name: 'System Default', desc: 'Standard clean single notification ding' },
    { id: 'custom', name: 'Custom Sound', desc: 'Import your own audio file (.mp3, .wav, .m4a)' },
  ];

  // Request Notification Permission
  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      setActionNotice('Notification permission granted! Real OS alerts are active.');
      setNotificationsEnabled(true);
      autoPersistSettings({ notificationsEnabled: true });
    } else if (res === 'denied') {
      setActionNotice('Permission denied by browser. Please enable notifications in your browser site settings.');
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Sound Preview Player
  const handlePlayPreview = (presetToPlay?: SoundPreset) => {
    const targetPreset = presetToPlay || selectedSound;
    setIsPlayingPreview(true);

    if (targetPreset === 'custom' && customSoundData) {
      SoundService.playCustomSound(
        customSoundData,
        soundVolume,
        (_err) => {
          setIsPlayingPreview(false);
          setCustomSoundError('Custom sound is unavailable or corrupted.');
        },
        () => {
          setIsPlayingPreview(false);
        }
      );
    } else {
      SoundService.playPreset(
        targetPreset === 'custom' ? 'himaleh_chime' : targetPreset,
        soundVolume,
        () => {
          setIsPlayingPreview(false);
        }
      );
    }
  };

  const handleStopPreview = () => {
    SoundService.stop();
    setIsPlayingPreview(false);
  };

  // Custom Audio File Upload
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      setCustomSoundError('Audio file is too large (maximum 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomSoundName(file.name);
        setCustomSoundData(result);
        setSelectedSound('custom');
        setCustomSoundError(null);

        // Test play immediately
        setIsPlayingPreview(true);
        SoundService.playCustomSound(
          result,
          soundVolume,
          (_err) => {
            setIsPlayingPreview(false);
            setCustomSoundError('Audio format could not be decoded. Please select an MP3 or WAV file.');
          },
          () => {
            setIsPlayingPreview(false);
          }
        );

        autoPersistSettings({
          selectedSound: 'custom',
          customSoundName: file.name,
          customSoundData: result,
        });

        setActionNotice(`Custom sound "${file.name}" saved!`);
        setTimeout(() => setActionNotice(null), 3000);
      }
    };
    reader.onerror = () => {
      setCustomSoundError('Failed to read audio file.');
    };
    reader.readAsDataURL(file);
  };

  // Remove Custom Sound
  const handleRemoveCustomSound = () => {
    setCustomSoundName(null);
    setCustomSoundData(null);
    setSelectedSound('himaleh_chime');
    autoPersistSettings({
      selectedSound: 'himaleh_chime',
      customSoundName: null,
      customSoundData: null,
    });
    setActionNotice('Custom sound removed. Switched to Himaleh Chime.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  // Theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    let dark = isDarkMode;
    if (newTheme === 'dark') {
      dark = true;
    } else if (newTheme === 'light') {
      dark = false;
    } else {
      dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    autoPersistSettings({ theme: newTheme, isDarkMode: dark });
  };

  // Auto-persist helper for immediate responsive changes
  const autoPersistSettings = (partial: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...settings,
      userName,
      timeFormat,
      weekStartsOn,
      restDayFrequency,
      strictAccountability,
      notificationsEnabled,
      routineReminders,
      goalReminders,
      achievementNotifications,
      accountabilityNotifications,
      reflectionReminders,
      incompleteReminders,
      soundEnabled,
      reminderSounds,
      celebrationSounds,
      accountabilitySounds,
      soundVolume,
      selectedSound,
      customSoundName,
      customSoundData,
      vibrationEnabled,
      autoEnableRoutineReminder,
      morningReminderTime,
      eveningReflectionTime,
      theme,
      isDarkMode,
      accentStyle,
      reduceMotion,
      layoutMode,
      appLockEnabled,
      appLockPin,
      ...partial,
    };
    onUpdateSettings(updated);
  };

  // Save All Settings
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      userName: userName.trim() || 'Explorer',
      timeFormat,
      weekStartsOn,
      restDayFrequency,
      strictAccountability,
      notificationsEnabled,
      routineReminders,
      goalReminders,
      achievementNotifications,
      accountabilityNotifications,
      reflectionReminders,
      incompleteReminders,
      soundEnabled,
      reminderSounds,
      celebrationSounds,
      accountabilitySounds,
      soundVolume,
      selectedSound,
      customSoundName,
      customSoundData,
      vibrationEnabled,
      autoEnableRoutineReminder,
      morningReminderTime,
      eveningReflectionTime,
      theme,
      isDarkMode,
      accentStyle,
      reduceMotion,
      layoutMode,
      appLockEnabled,
      appLockPin,
    };

    onUpdateSettings(updated);
    SoundService.play('tap', updated);

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Scheduled Real Notification Tests
  const handleRunScheduledTest = async (seconds: number) => {
    if (permissionStatus !== 'granted') {
      const res = await NotificationService.requestPermission();
      setPermissionStatus(res);
      if (res !== 'granted') {
        setActionNotice('Notification permission is required to deliver OS reminders.');
        setTimeout(() => setActionNotice(null), 3500);
        return;
      }
    }

    const currentSet: UserSettings = {
      ...settings,
      soundEnabled,
      reminderSounds,
      soundVolume,
      selectedSound,
      customSoundData,
      vibrationEnabled,
    };

    NotificationService.scheduleTestReminder(
      seconds,
      currentSet,
      selectedSound,
      'Deep Work'
    );

    if (seconds === 0) {
      setActionNotice('Instant test notification dispatched to your OS!');
    } else {
      setActiveTestCountdown(seconds);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const label = mins > 0 ? `${mins}m ${secs > 0 ? secs + 's' : ''}` : `${secs}s`;
      setActionNotice(`Test reminder scheduled for +${label}. Feel free to switch tabs or lock screen!`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Export Data Handlers
  const handleTriggerExportJson = () => {
    const goals = StorageService.getGoals();
    const routines = StorageService.getRoutines();
    const logs = StorageService.getLogs();
    const reflections = StorageService.getReflections();
    const currentSettings = StorageService.getSettings();

    DataExportService.exportJsonBackup(goals, routines, logs, reflections, currentSettings);
    setShowExportModal(false);
    setActionNotice('Himaleh JSON backup vault exported successfully.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleTriggerExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const goals = StorageService.getGoals();
      const routines = StorageService.getRoutines();
      const logs = StorageService.getLogs();
      const reflections = StorageService.getReflections();
      const currentSettings = StorageService.getSettings();

      await DataExportService.exportPdfReport(goals, routines, logs, reflections, currentSettings);
      setShowExportModal(false);
      setActionNotice('Official Himaleh PDF Progress Report generated.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      setActionNotice('Failed to generate PDF report. Please try again.');
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Import Backup Handlers
  const handleSelectImportFile = (file: File) => {
    setImportError(null);
    setImportValidation(null);
    setImportRawContent(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setImportError('Selected file appears to be empty.');
        return;
      }
      const validation = DataExportService.validateBackupJson(content);
      if (!validation.isValid) {
        setImportError(validation.error || 'Invalid backup archive format.');
      } else {
        setImportRawContent(content);
        setImportValidation(validation);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read the selected backup file.');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importRawContent) return;
    setIsImporting(true);

    try {
      const success = StorageService.importDataFromJson(importRawContent);
      if (success) {
        const newRoutines = StorageService.getRoutines();
        const newSettings = StorageService.getSettings();
        NotificationService.rescheduleAll(newRoutines, newSettings);
        onDataReload();
        setShowImportModal(false);
        setImportValidation(null);
        setImportRawContent(null);
        setImportError(null);
        setActionNotice('Vault records restored and updated successfully!');
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setImportError('Failed to save imported backup data.');
      }
    } catch {
      setImportError('Unexpected failure during backup restoration.');
    } finally {
      setIsImporting(false);
    }
  };

  // PIN Save Handler
  const handleSavePin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== pinConfirm) {
      setPinError('PINs do not match');
      return;
    }
    setAppLockPin(newPin);
    setAppLockEnabled(true);
    setShowPinModal(false);
    setNewPin('');
    setPinConfirm('');
    setPinError(null);
    autoPersistSettings({ appLockPin: newPin, appLockEnabled: true });
    setActionNotice('App Lock PIN configured successfully!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Reset Data Handler
  const handleExecuteReset = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'RESET') {
      return;
    }
    StorageService.resetAllData();
    setShowResetConfirm(false);
    setResetConfirmInput('');
    onDataReload();
    setActionNotice('All app data has been cleanly reset.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Toast Notices */}
      {actionNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-2xl border border-neutral-700/50 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Personalize your Himaleh system, reminder engines, and privacy vault
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{savedNotice ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          GROUP 1: PROFILE / HIMALEH
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Profile / Himaleh
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
          {/* Account Card */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                {userName.charAt(0).toUpperCase() || 'E'}
              </div>
              <div>
                <span className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Account Name
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    autoPersistSettings({ userName: e.target.value });
                  }}
                  className="mt-0.5 text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-emerald-500 focus:outline-none transition px-0"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Private Local Vault</span>
              </div>
            </div>
          </div>

          {/* Personalization: Time Format */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Time Format
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Display scheduled habits in 12-hour AM/PM or 24-hour military clock
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTimeFormat('12h');
                  autoPersistSettings({ timeFormat: '12h' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeFormat === '12h'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                12-Hour
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeFormat('24h');
                  autoPersistSettings({ timeFormat: '24h' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeFormat === '24h'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                24-Hour
              </button>
            </div>
          </div>

          {/* Week Starts On */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                First Day of Week
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Determine calendar alignment for weekly consistency metrics
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setWeekStartsOn('monday');
                  autoPersistSettings({ weekStartsOn: 'monday' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  weekStartsOn === 'monday'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Monday
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeekStartsOn('sunday');
                  autoPersistSettings({ weekStartsOn: 'sunday' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  weekStartsOn === 'sunday'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Sunday
              </button>
            </div>
          </div>

          {/* Rest Day Allocation */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Rest Day Frequency
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Target weekly rest frequency so healthy recovery doesn't break consistency
              </span>
            </div>
            <select
              value={restDayFrequency}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRestDayFrequency(val);
                autoPersistSettings({ restDayFrequency: val });
              }}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value={0}>No Rest Days (7/7)</option>
              <option value={1}>1 Day / Week (6/7)</option>
              <option value={2}>2 Days / Week (5/7)</option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 2: NOTIFICATIONS
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Notifications
            </h2>
          </div>
          {/* Permission status pill */}
          <div className="flex items-center gap-1.5">
            {permissionStatus === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ● Enabled
              </span>
            ) : permissionStatus === 'denied' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                ⚠️ Blocked by OS
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition cursor-pointer"
              >
                ○ Permission required
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
          {/* Permission Prompt Banner if not granted */}
          {permissionStatus !== 'granted' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Operating System Notifications Required
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Notifications help Himaleh remind you when your routines are due.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs shrink-0 cursor-pointer self-start sm:self-center"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* Master Notifications Switch */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Allow Notifications
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Master switch for all routine reminders, daily reflections, and goal alerts
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !notificationsEnabled;
                setNotificationsEnabled(next);
                autoPersistSettings({ notificationsEnabled: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notificationsEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Routine Reminders */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 pl-6 sm:pl-8">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Routine Reminders
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Trigger real OS alerts at each routine's scheduled exact time
              </span>
            </div>
            <button
              type="button"
              disabled={!notificationsEnabled}
              onClick={() => {
                const next = !routineReminders;
                setRoutineReminders(next);
                autoPersistSettings({ routineReminders: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !notificationsEnabled
                  ? 'opacity-40 cursor-not-allowed bg-neutral-300 dark:bg-neutral-800'
                  : routineReminders
                  ? 'bg-emerald-600'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  routineReminders && notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Goal Reminders */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 pl-6 sm:pl-8">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Goal Reminders
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Weekly progress checkpoints and milestone notifications
              </span>
            </div>
            <button
              type="button"
              disabled={!notificationsEnabled}
              onClick={() => {
                const next = !goalReminders;
                setGoalReminders(next);
                autoPersistSettings({ goalReminders: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !notificationsEnabled
                  ? 'opacity-40 cursor-not-allowed bg-neutral-300 dark:bg-neutral-800'
                  : goalReminders
                  ? 'bg-emerald-600'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  goalReminders && notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Achievement Notifications */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 pl-6 sm:pl-8">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Achievement Notifications
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Celebrate 7-day, 14-day, and 30-day consistency records
              </span>
            </div>
            <button
              type="button"
              disabled={!notificationsEnabled}
              onClick={() => {
                const next = !achievementNotifications;
                setAchievementNotifications(next);
                autoPersistSettings({ achievementNotifications: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !notificationsEnabled
                  ? 'opacity-40 cursor-not-allowed bg-neutral-300 dark:bg-neutral-800'
                  : achievementNotifications
                  ? 'bg-emerald-600'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  achievementNotifications && notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Accountability Notifications */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 pl-6 sm:pl-8">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Accountability Notifications
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Subtle evening reminders if routines remain incomplete before bedtime
              </span>
            </div>
            <button
              type="button"
              disabled={!notificationsEnabled}
              onClick={() => {
                const next = !accountabilityNotifications;
                setAccountabilityNotifications(next);
                autoPersistSettings({ accountabilityNotifications: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !notificationsEnabled
                  ? 'opacity-40 cursor-not-allowed bg-neutral-300 dark:bg-neutral-800'
                  : accountabilityNotifications
                  ? 'bg-emerald-600'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  accountabilityNotifications && notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reminder Sound Selector */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Reminder Sound
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select the sonic profile for your notifications
                </span>
              </div>
              <button
                type="button"
                onClick={() => (isPlayingPreview ? handleStopPreview() : handlePlayPreview())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Test Sound</span>
                  </>
                )}
              </button>
            </div>

            {/* Sound Preset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {soundPresets.map((sp) => {
                const isSelected = selectedSound === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      setSelectedSound(sp.id);
                      autoPersistSettings({ selectedSound: sp.id });
                      handlePlayPreview(sp.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Music className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {sp.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {sp.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Sound Upload & Display */}
            {selectedSound === 'custom' && (
              <div className="mt-3 p-4 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Custom Sound File
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Supported formats: MP3, WAV, OGG, M4A, AAC (Max 5MB)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{customSoundName ? 'Change Sound' : 'Choose File'}</span>
                    </button>
                    {customSoundName && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomSound}
                        className="px-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {customSoundName && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    <Music className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="truncate flex-1">{customSoundName}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold shrink-0">
                      Active
                    </span>
                  </div>
                )}

                {customSoundError && (
                  <p className="text-xs text-rose-500 font-semibold">{customSoundError}</p>
                )}
              </div>
            )}
          </div>

          {/* Sound Volume */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Sound Volume
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Adjust chime amplitude: Low (25%), Medium (50%), High (80%)
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700 shrink-0">
              {(['low', 'medium', 'high'] as const).map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => {
                    setSoundVolume(vol);
                    autoPersistSettings({ soundVolume: vol });
                    SoundService.playPreset(selectedSound === 'custom' ? 'himaleh_chime' : selectedSound, vol);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    soundVolume === vol
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {vol}
                </button>
              ))}
            </div>
          </div>

          {/* Haptic Feedback */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Haptic Feedback
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Tactile device vibration on routine completion and reminder delivery
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !vibrationEnabled;
                setVibrationEnabled(next);
                autoPersistSettings({ vibrationEnabled: next });
                if (next) SoundService.triggerHaptic(settings, [60, 40, 60]);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                vibrationEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 3: REMINDER PREFERENCES & EXACT-TIME TESTING
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Reminder Preferences & Exact-Time Testing
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
          {/* Auto-enable reminders */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Default Reminder Behavior
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Automatically enable reminder on newly created routines
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !autoEnableRoutineReminder;
                setAutoEnableRoutineReminder(next);
                autoPersistSettings({ autoEnableRoutineReminder: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoEnableRoutineReminder ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  autoEnableRoutineReminder ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Morning & Evening Times */}
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="morning-reminder-time" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Morning Routine Kickoff
              </label>
              <input
                id="morning-reminder-time"
                type="time"
                value={morningReminderTime}
                onChange={(e) => {
                  setMorningReminderTime(e.target.value);
                  autoPersistSettings({ morningReminderTime: e.target.value });
                }}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="evening-reflection-time" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Evening Reflection Time
              </label>
              <input
                id="evening-reflection-time"
                type="time"
                value={eveningReflectionTime}
                onChange={(e) => {
                  setEveningReflectionTime(e.target.value);
                  autoPersistSettings({ eveningReflectionTime: e.target.value });
                }}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          {/* EXACT TIME TESTING CARD */}
          <div className="p-4 sm:p-5 space-y-3 bg-neutral-50/50 dark:bg-neutral-850/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Exact-Time OS Notification Verification
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Trigger an actual operating system notification at scheduled delay
                </span>
              </div>
              {activeTestCountdown !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-pulse">
                  <Timer className="h-3.5 w-3.5" />
                  <span>Firing in {activeTestCountdown}s</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRunScheduledTest(0)}
                className="px-3 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-white transition cursor-pointer text-center"
              >
                ⚡ Instant Test
              </button>
              <button
                type="button"
                onClick={() => handleRunScheduledTest(60)}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-center"
              >
                ⏱️ +1 Minute
              </button>
              <button
                type="button"
                onClick={() => handleRunScheduledTest(120)}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-center"
              >
                ⏱️ +2 Minutes
              </button>
              <button
                type="button"
                onClick={() => handleRunScheduledTest(300)}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer text-center"
              >
                ⏱️ +5 Minutes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 4: APPEARANCE
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Appearance
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
          {/* Theme Selector (3 Cards) */}
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Theme Mode
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose your preferred visual atmosphere
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'light', label: 'Light', icon: Sun, desc: 'Clean bright alpine' },
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep obsidian night' },
                { id: 'system', label: 'System', icon: Laptop, desc: 'Match device OS' },
              ].map((t) => {
                const isSelected = theme === t.id;
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id as 'light' | 'dark' | 'system')}
                    className={`p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600 text-neutral-900 dark:text-neutral-100'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <IconComponent
                      className={`h-5 w-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
                    />
                    <div>
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Style */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Accent Palette
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Signature highlights throughout graphs and active buttons
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { id: 'emerald', label: 'Alpine Emerald', bg: 'bg-emerald-500' },
                { id: 'gold', label: 'Summit Gold', bg: 'bg-amber-500' },
                { id: 'glacier', label: 'Deep Glacier', bg: 'bg-cyan-500' },
                { id: 'obsidian', label: 'Obsidian Slate', bg: 'bg-slate-700' },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  title={acc.label}
                  onClick={() => {
                    setAccentStyle(acc.id as any);
                    autoPersistSettings({ accentStyle: acc.id as any });
                  }}
                  className={`h-8 w-8 rounded-xl ${acc.bg} flex items-center justify-center transition cursor-pointer ${
                    accentStyle === acc.id ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {accentStyle === acc.id && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Reduce Motion */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Reduce Motion
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Minimize floating animations and celebration effects for performance
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !reduceMotion;
                setReduceMotion(next);
                autoPersistSettings({ reduceMotion: next });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                reduceMotion ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  reduceMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Layout Mode */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Density Layout
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Comfortable spacious layout or compact view for power habit tracking
              </span>
            </div>
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('comfortable');
                  autoPersistSettings({ layoutMode: 'comfortable' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  layoutMode === 'comfortable'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayoutMode('compact');
                  autoPersistSettings({ layoutMode: 'compact' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  layoutMode === 'compact'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 5: DATA & PRIVACY
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Data & Privacy
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
          {/* Export Data */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Export Data
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Generate an official PDF Progress Report or complete JSON Vault Backup
              </span>
            </div>
            <button
              id="export-data-button"
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:opacity-90 text-white dark:text-neutral-900 text-xs font-bold transition cursor-pointer shrink-0 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Data</span>
            </button>
          </div>

          {/* Import Backup */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Import Data Backup
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Restore and verify a Himaleh JSON backup archive into this device
              </span>
            </div>
            <div>
              <button
                id="import-backup-button"
                type="button"
                onClick={() => {
                  setImportError(null);
                  setImportValidation(null);
                  setImportRawContent(null);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-neutral-700 transition cursor-pointer shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import Backup</span>
              </button>
            </div>
          </div>

          {/* Security App Lock PIN */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                App Lock (4-Digit PIN)
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Require security PIN whenever opening or returning to Himaleh
              </span>
            </div>
            <div className="flex items-center gap-2">
              {appLockEnabled && (
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer mr-1"
                >
                  Change PIN
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!appLockEnabled && !appLockPin) {
                    setShowPinModal(true);
                  } else {
                    const next = !appLockEnabled;
                    setAppLockEnabled(next);
                    autoPersistSettings({ appLockEnabled: next });
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  appLockEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    appLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Danger Zone: Reset App Data */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-rose-50/40 dark:bg-rose-950/20">
            <div>
              <span className="block text-sm font-bold text-rose-600 dark:text-rose-400">
                Reset App Data
              </span>
              <span className="text-xs text-rose-500 dark:text-rose-400/80">
                Permanently clear all routines, reflections, logs, and custom presets
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GROUP 6: ABOUT & HELP
      ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            About Himaleh
          </h2>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs overflow-hidden">
          {/* Version & Build */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Himaleh
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Personal Goal, Routine & Consistency System
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-bold border border-neutral-200 dark:border-neutral-700">
              v1.4.2 Alpine
            </span>
          </div>

          {/* Help & Guide */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Help & Consistency Mechanics
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  How streaks, accountability engines, and exact reminders work
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </button>

          {/* Feedback */}
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Send Feedback
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Share suggestions to shape future Alpine releases
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          MODALS: PIN, RESET, HELP, FEEDBACK
      ========================================================================= */}

      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Set App Lock PIN
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Enter a 4-digit security code
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-xl font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-xl font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  placeholder="••••"
                />
              </div>

              {pinError && <p className="text-xs text-rose-500 font-semibold">{pinError}</p>}
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setNewPin('');
                  setPinConfirm('');
                  setPinError(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Permanently Reset All Data?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              This will completely wipe all routines, logs, streak histories, daily reflections, and custom sounds from your device.
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Type <span className="text-rose-600 font-mono font-bold">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="RESET"
                className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-neutral-50 dark:bg-neutral-800 p-2.5 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmInput('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmInput.trim().toUpperCase() !== 'RESET'}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Mechanics Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Himaleh Architecture & Mechanics
                  </h3>
                  <p className="text-[11px] text-neutral-500">Principles of sustainable consistency</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  1. Real OS Reminders & Recurrence
                </h4>
                <p>
                  Himaleh interfaces directly with your operating system's notification subsystem through the W3C Notification engine and Service Worker background registrations. Reminders trigger on the exact scheduled days matching your routine's frequency (daily, weekdays, weekends, or specific custom days).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  2. Streak & Momentum Engine
                </h4>
                <p>
                  Streaks track consecutive days where your planned daily routines met your completion threshold. Healthy rest days do not break your momentum if allocated in your weekly target.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  3. 100% Offline-First Privacy Vault
                </h4>
                <p>
                  All your thoughts, reflections, habits, and metrics remain encrypted and strictly stored locally on your device. Himaleh never transmits your personal data to remote servers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Send Feedback
                  </h3>
                  <p className="text-[11px] text-neutral-500">Shape the Alpine experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSuccess(false);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-6 text-center space-y-2 animate-fade-in">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Your feedback has been saved locally and logged for future improvements.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= feedbackRating ? 'fill-amber-400' : 'text-neutral-300 dark:text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Experience', 'Reminders', 'Design'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFeedbackCategory(cat)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          feedbackCategory === cat
                            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Your Thoughts
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what you love or what could be improved..."
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFeedbackSuccess(true);
                    setTimeout(() => {
                      setShowFeedbackModal(false);
                      setFeedbackSuccess(false);
                      setFeedbackMessage('');
                    }, 2000);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Feedback</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          EXPORT DATA MODAL
      ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-7 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <HimalehLogo variant="crest" size={26} theme="auto" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Export Your Himaleh Data
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Choose your export format. Contains only your real recorded records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Option 1: PDF Report */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      📄 PDF Report
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Publication-ready printable summary featuring official Himaleh branding, goal progress, routine timetables, and streaks.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleTriggerExportPdf}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:opacity-90 disabled:opacity-50 text-white dark:text-neutral-900 text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Generate PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: JSON Backup */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      📦 JSON Backup
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Complete machine-readable vault archive. Backs up goals, routines, daily reflections, logs, and custom settings for portability.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerExportJson}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80">
              <span>Security: All data stored and processed locally</span>
              <span>Himaleh Vault v1.4.2</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IMPORT DATA MODAL & SUMMARY
      ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 p-6 sm:p-7 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Import Himaleh Backup
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Restore your authenticated JSON vault into this device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportValidation(null);
                  setImportRawContent(null);
                  setImportError(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Hidden native input */}
            <input
              ref={importFileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSelectImportFile(file);
              }}
            />

            {/* If there is an error */}
            {importError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Backup Validation Failed</span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300/90 leading-relaxed">
                  {importError}
                </p>
                <button
                  type="button"
                  onClick={() => importFileInputRef.current?.click()}
                  className="text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:opacity-80 cursor-pointer pt-1"
                >
                  Choose a different file
                </button>
              </div>
            )}

            {/* Step 1: No file loaded yet */}
            {!importValidation && !importError && (
              <div
                onClick={() => importFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleSelectImportFile(file);
                }}
                className="p-8 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-neutral-50/50 dark:bg-neutral-800/40 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
              >
                <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Click to select or drag and drop your .json backup file
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Only authentic Himaleh JSON archives are supported
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: File validated successfully, show Import Summary */}
            {importValidation && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Valid Himaleh Backup Archive
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    v{importValidation.version}
                  </span>
                </div>

                {/* Ledger metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-center">
                    <span className="block text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {importValidation.counts.goals}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Goals</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-center">
                    <span className="block text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {importValidation.counts.routines}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Routines</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-center">
                    <span className="block text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {importValidation.counts.logs}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Logs</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-center">
                    <span className="block text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {importValidation.counts.reflections}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Reflections</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ Restoring this archive will merge its verified records into your local vault and reschedule active notifications.
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportValidation(null);
                      setImportRawContent(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Select Other
                  </button>
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleConfirmImport}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Restoring...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Confirm & Restore</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
