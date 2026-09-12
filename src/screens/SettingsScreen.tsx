import React, { useState, useRef } from 'react';
import { UserSettings } from '../types';
import { StorageService } from '../data/storage';
import {
  User,
  ShieldAlert,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Check,
  Moon,
  Sun,
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
  const [userName, setUserName] = useState(settings.userName);
  const [morningReminderTime, setMorningReminderTime] = useState(settings.morningReminderTime);
  const [eveningReflectionTime, setEveningReflectionTime] = useState(settings.eveningReflectionTime);
  const [strictAccountability, setStrictAccountability] = useState(settings.strictAccountability);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [isDarkMode, setIsDarkMode] = useState(settings.isDarkMode);

  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      userName: userName.trim() || 'Explorer',
      morningReminderTime,
      eveningReflectionTime,
      strictAccountability,
      notificationsEnabled,
      isDarkMode,
    };
    onUpdateSettings(updated);

    // Apply dark mode class to html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
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
          alert('Backup data successfully restored!');
          onDataReload();
        } else {
          alert('Failed to parse backup JSON file. Please check file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all goals, routines, and logs to starter sample data?')) {
      StorageService.resetToDefaults();
      onDataReload();
      alert('Data reset to starter defaults.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Preferences & Data
          </h1>
        </div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
          Tune your accountability rules, notification schedule, and manage local backups
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              User Profile
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Your Name / Explorer Handle
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Accountability Engine Preferences */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Accountability Engine
            </h2>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60">
            <div className="space-y-0.5 max-w-sm">
              <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Strict Accountability Mode
              </span>
              <span className="text-[11px] text-neutral-500 leading-relaxed block">
                Escalates warnings sooner and enforces strict accountability alerts if routines fall behind schedule.
              </span>
            </div>
            <input
              type="checkbox"
              checked={strictAccountability}
              onChange={(e) => setStrictAccountability(e.target.checked)}
              className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Schedule & Reminders */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Schedule & Reminders
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
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
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
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60">
            <div>
              <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                In-App Notification Alerts
              </span>
              <span className="text-[11px] text-neutral-500">
                Display reminders and daily streak milestone celebrations
              </span>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60">
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Moon className="h-4 w-4 text-neutral-400" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
              <div>
                <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Dark Theme
                </span>
                <span className="text-[11px] text-neutral-500">
                  Easy on the eyes for late night reflection
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
              className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <Check className="h-4 w-4" /> Preferences saved!
            </span>
          )}
          <button
            type="submit"
            className="rounded-2xl bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-xs font-bold text-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Backup & Data Management */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Backup & Data Portability
          </h2>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Himaleh is 100% private and offline-first. Your habits, goals, and reflections remain stored locally in your browser session. You can export a JSON backup at any time or restore it on any device.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-blue-500" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
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
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-rose-500" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
