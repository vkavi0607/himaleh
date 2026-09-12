import React, { useState, useRef } from 'react';
import { UserSettings, SoundPreset } from '../types';
import { StorageService } from '../data/storage';
import { SoundService } from '../services/SoundService';
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
  Volume2,
  Play,
  Square,
  Music,
  Lock,
  Vibrate,
  Eye,
  AlertTriangle,
  FolderOpen,
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
  // State for all setting fields
  const [userName, setUserName] = useState(settings.userName);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'system');
  const [isDarkMode, setIsDarkMode] = useState(settings.isDarkMode);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(settings.timeFormat || '12h');
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>(settings.weekStartsOn || 'monday');

  // Reminders
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [routineReminders, setRoutineReminders] = useState(settings.routineReminders ?? true);
  const [goalReminders, setGoalReminders] = useState(settings.goalReminders ?? true);
  const [reflectionReminders, setReflectionReminders] = useState(settings.reflectionReminders ?? true);
  const [incompleteReminders, setIncompleteReminders] = useState(settings.incompleteReminders ?? true);
  const [morningReminderTime, setMorningReminderTime] = useState(settings.morningReminderTime);
  const [eveningReflectionTime, setEveningReflectionTime] = useState(settings.eveningReflectionTime);
  const [strictAccountability, setStrictAccountability] = useState(settings.strictAccountability);

  // Sound & Accessibility
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [reminderSounds, setReminderSounds] = useState(settings.reminderSounds ?? true);
  const [celebrationSounds, setCelebrationSounds] = useState(settings.celebrationSounds ?? true);
  const [accountabilitySounds, setAccountabilitySounds] = useState(settings.accountabilitySounds ?? true);
  const [soundVolume, setSoundVolume] = useState<'low' | 'medium' | 'high'>(settings.soundVolume || 'medium');
  const [selectedSound, setSelectedSound] = useState<SoundPreset>(settings.selectedSound || 'himaleh_chime');
  const [customSoundName, setCustomSoundName] = useState<string | null>(settings.customSoundName || null);
  const [customSoundData, setCustomSoundData] = useState<string | null>(settings.customSoundData || null);
  const [customSoundError, setCustomSoundError] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Haptics & Motion
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled ?? true);
  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion ?? false);

  // Security / App Lock
  const [appLockEnabled, setAppLockEnabled] = useState(settings.appLockEnabled ?? false);
  const [appLockPin, setAppLockPin] = useState(settings.appLockPin || '');
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Status & Feedback
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sound presets list
  const soundPresets: Array<{ id: SoundPreset; name: string; desc: string }> = [
    { id: 'himaleh_chime', name: 'Himaleh Chime', desc: 'Pentatonic crystalline alpine chime' },
    { id: 'soft_reminder', name: 'Soft Reminder', desc: 'Warm dual mallet bell tone' },
    { id: 'focus_bell', name: 'Focus Bell', desc: 'Resonant Tibetan meditation singing bowl' },
    { id: 'achievement', name: 'Achievement', desc: 'Ascending chord milestone tone' },
    { id: 'gentle_alert', name: 'Gentle Alert', desc: 'Subtle high-frequency bubble chime' },
    { id: 'system_default', name: 'System Default', desc: 'Standard clean single notification ding' },
    { id: 'custom', name: 'Custom Sound', desc: 'Import your own audio file (.mp3, .wav, .m4a)' },
  ];

  // Theme application helper
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    let dark = isDarkMode;
    if (newTheme === 'dark') {
      dark = true;
    } else if (newTheme === 'light') {
      dark = false;
    } else {
      // system
      dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sound Preview
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

  // Custom Audio File Import
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

        // Test playing custom sound immediately
        setIsPlayingPreview(true);
        SoundService.playCustomSound(
          result,
          soundVolume,
          (_err) => {
            setIsPlayingPreview(false);
            setCustomSoundError('Audio format could not be decoded. Please select another audio file.');
          },
          () => {
            setIsPlayingPreview(false);
          }
        );
      }
    };
    reader.onerror = () => {
      setCustomSoundError('Failed to read audio file.');
    };
    reader.readAsDataURL(file);
  };

  // Save All Settings
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      userName: userName.trim() || 'Explorer',
      morningReminderTime,
      eveningReflectionTime,
      strictAccountability,
      notificationsEnabled,
      routineReminders,
      goalReminders,
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
      reduceMotion,
      theme,
      isDarkMode,
      timeFormat,
      weekStartsOn,
      appLockEnabled,
      appLockPin,
    };

    onUpdateSettings(updated);

    // Apply dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Play subtle chime on save
    SoundService.play('tap', updated);

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
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
    setActionNotice('App Lock PIN configured successfully!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportJson = () => {
    const jsonStr = StorageService.exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `himaleh-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setActionNotice('Backup data exported to JSON!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importDataFromJson(content);
        if (success) {
          setActionNotice('Backup data successfully restored!');
          onDataReload();
        } else {
          setActionNotice('Failed to parse backup JSON file. Please verify format.');
        }
        setTimeout(() => setActionNotice(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = () => {
    StorageService.loadRichSampleData();
    onDataReload();
    setActionNotice('Rich 30-day challenge and routine sample dataset loaded successfully!');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleConfirmReset = () => {
    StorageService.resetToDefaults();
    onDataReload();
    setShowResetConfirm(false);
    setActionNotice('Data reset to clean starter defaults.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
          Settings & Preferences
        </h1>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
          Customize notifications, soundscape, visual theme, privacy lock, and local data storage
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Profile Section */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
              User Profile
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Explorer Name / Identity
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 2. Visual Theme & Appearance */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
              Appearance & Layout
            </h2>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Color Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                }`}
              >
                <Moon className="h-4 w-4 text-indigo-400" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                }`}
              >
                <Laptop className="h-4 w-4 text-neutral-500" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Time Display Format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Time Format
                </span>
                <span className="text-[11px] text-neutral-500">
                  Choose 12-hour (07:30 AM) or 24-hour (19:30)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 self-start sm:self-auto bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setTimeFormat('12h')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  timeFormat === '12h'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                12h (AM/PM)
              </button>
              <button
                type="button"
                onClick={() => setTimeFormat('24h')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  timeFormat === '24h'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                24h
              </button>
            </div>
          </div>

          {/* Week Starts On */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
            <div>
              <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Week Starts On
              </span>
              <span className="text-[11px] text-neutral-500">
                Calendar and weekly consistency calculation starting day
              </span>
            </div>
            <div className="flex items-center gap-1 self-start sm:self-auto bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setWeekStartsOn('monday')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  weekStartsOn === 'monday'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Monday
              </button>
              <button
                type="button"
                onClick={() => setWeekStartsOn('sunday')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  weekStartsOn === 'sunday'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Sunday
              </button>
            </div>
          </div>
        </div>

        {/* 3. Soundscape & Accessibility */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                Soundscape & Audio Feedback
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                {soundEnabled ? 'Enabled' : 'Muted'}
              </span>
              <input
                id="sound-master-toggle"
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {soundEnabled && (
            <div className="space-y-4 pt-1">
              {/* Sound Volume Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Audio Output Volume
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => {
                        setSoundVolume(vol);
                        SoundService.playPreset(selectedSound === 'custom' ? 'himaleh_chime' : selectedSound, vol);
                      }}
                      className={`py-2 px-3 rounded-2xl border text-xs font-bold capitalize transition cursor-pointer ${
                        soundVolume === vol
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {vol} Volume
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Preset Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Notification Sound Identity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {soundPresets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedSound(preset.id);
                        if (preset.id !== 'custom') {
                          handlePlayPreview(preset.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedSound === preset.id
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-neutral-900 dark:text-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold">{preset.name}</span>
                        <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                          {preset.desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {selectedSound === preset.id && (
                          <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Sound File Picker */}
              {selectedSound === 'custom' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Custom Audio File
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {customSoundName ? `Current file: ${customSoundName}` : 'No custom audio selected'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span>Choose File...</span>
                    </button>
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </div>

                  {customSoundError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{customSoundError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Preview Controls */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Live Sound Preview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isPlayingPreview ? (
                    <button
                      type="button"
                      onClick={handleStopPreview}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                    >
                      <Square className="h-3 w-3" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlayPreview()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Play Preview</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Sound Toggles */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Sound Trigger Categories
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40 cursor-pointer">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Reminders
                    </span>
                    <input
                      type="checkbox"
                      checked={reminderSounds}
                      onChange={(e) => setReminderSounds(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40 cursor-pointer">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Celebrations
                    </span>
                    <input
                      type="checkbox"
                      checked={celebrationSounds}
                      onChange={(e) => setCelebrationSounds(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40 cursor-pointer">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Accountability
                    </span>
                    <input
                      type="checkbox"
                      checked={accountabilitySounds}
                      onChange={(e) => setAccountabilitySounds(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Haptics & Reduce Motion Accessibility */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Sensory & Accessibility
            </span>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Haptic Vibration Feedback
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Tactile pulses on task completions and alerts
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => {
                  setVibrationEnabled(e.target.checked);
                  if (e.target.checked) SoundService.triggerHaptic(undefined, 40);
                }}
                className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Reduce Motion
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Simplifies preloader and UI transitions
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Schedule, Reminders & Accountability */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
              Reminders & Accountability
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Morning Kickoff Time
              </label>
              <input
                type="time"
                value={morningReminderTime}
                onChange={(e) => setMorningReminderTime(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Evening Reflection Time
              </label>
              <input
                type="time"
                value={eveningReflectionTime}
                onChange={(e) => setEveningReflectionTime(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
            <div>
              <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Browser Notifications Master Toggle
              </span>
              <span className="text-[11px] text-neutral-500">
                Request push notifications for scheduled routine reminders
              </span>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => {
                setNotificationsEnabled(e.target.checked);
                if (e.target.checked && typeof Notification !== 'undefined') {
                  Notification.requestPermission();
                }
              }}
              className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Granular Notification Channels */}
          {notificationsEnabled && (
            <div className="p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40 space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Notification Channels
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Routine Reminders
                  </span>
                  <input
                    type="checkbox"
                    checked={routineReminders}
                    onChange={(e) => setRoutineReminders(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Goal Deadlines
                  </span>
                  <input
                    type="checkbox"
                    checked={goalReminders}
                    onChange={(e) => setGoalReminders(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Evening Reflection
                  </span>
                  <input
                    type="checkbox"
                    checked={reflectionReminders}
                    onChange={(e) => setReflectionReminders(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Incomplete Overdue Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={incompleteReminders}
                    onChange={(e) => setIncompleteReminders(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Strict Accountability Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60">
            <div className="space-y-0.5 max-w-sm">
              <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Strict Accountability Mode
              </span>
              <span className="text-[11px] text-neutral-500 leading-relaxed block">
                Shows prominent reminders (😠) when genuinely planned routines remain incomplete past their scheduled window.
              </span>
            </div>
            <input
              type="checkbox"
              checked={strictAccountability}
              onChange={(e) => setStrictAccountability(e.target.checked)}
              className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* 5. Privacy & App Lock */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                Privacy & Screen Lock
              </h2>
            </div>
            {appLockEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setAppLockEnabled(false);
                  setAppLockPin('');
                }}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Disable Lock
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Set 4-Digit PIN
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                PIN Protection Status: {appLockEnabled ? 'Active (Locked)' : 'Off'}
              </span>
              <span className="text-[11px] text-neutral-500">
                {appLockEnabled
                  ? 'PIN required on startup to protect your goals and private reflections.'
                  : 'App can be accessed directly without entering a passcode.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={appLockEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  setShowPinModal(true);
                } else {
                  setAppLockEnabled(false);
                  setAppLockPin('');
                }
              }}
              className="h-5 w-5 rounded-md accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Preferences saved!
            </span>
          )}
          <button
            id="save-preferences-button"
            type="submit"
            className="rounded-2xl bg-neutral-900 dark:bg-neutral-100 px-6 py-3 text-xs font-bold text-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition cursor-pointer min-h-[44px]"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* 6. Backup & Data Management */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
            Backup & Data Portability
          </h2>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Himaleh is 100% private and offline-first. Your habits, goals, and reflections remain stored locally in your browser storage. You can export a JSON backup at any time or restore it on any device.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer min-h-[44px]"
          >
            <Download className="h-4 w-4 text-blue-500" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer min-h-[44px]"
          >
            <Upload className="h-4 w-4 text-emerald-500" />
            <span>Import Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />

          <button
            id="load-sample-data-button"
            type="button"
            onClick={handleLoadSampleData}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer min-h-[44px]"
          >
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Load Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="h-4 w-4 text-rose-500" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {actionNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {actionNotice}
          </div>
        )}

        {showResetConfirm && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
            <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
              Reset all goals, routines, and logs to starter sample data? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer min-h-[40px]"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 font-display">
                Set 4-Digit Security PIN
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Enter 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-mono rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-mono rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5"
                  placeholder="••••"
                />
              </div>

              {pinError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{pinError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setNewPin('');
                  setPinConfirm('');
                  setPinError(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Enable PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
