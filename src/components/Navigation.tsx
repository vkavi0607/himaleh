import React from 'react';
import { ScreenNav } from '../types';
import { LayoutDashboard, Target, Repeat, BarChart3, Settings, Sun, Moon, Laptop, Clock } from 'lucide-react';
import { HimalehLogo } from './HimalehLogo';
import { useTheme } from '../theme/ThemeContext';

interface NavigationProps {
  currentScreen: ScreenNav;
  onNavigate: (screen: ScreenNav) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  const { themePreference, toggleTheme } = useTheme();

  const tabs: Array<{ id: ScreenNav; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'routines', label: 'Routines', icon: Repeat },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Header Nav (Sticky Top) */}
      <header className="sticky top-0 z-40 hidden md:block border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => onNavigate('dashboard')}
          >
            <HimalehLogo variant="horizontal" size={38} showTagline={true} />
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentScreen === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => onNavigate(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm border border-slate-700/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-500 dark:text-amber-600' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

            <button
              id="quick-theme-toggle-desktop"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
              title={`Theme: ${themePreference === 'auto_time' ? 'AUTO BY TIME' : themePreference.toUpperCase()} (Click to cycle Light/Dark/System/Auto Time)`}
              aria-label={`Current theme is ${themePreference}. Click to cycle themes.`}
            >
              {themePreference === 'light' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : themePreference === 'dark' ? (
                <Moon className="h-4 w-4 text-indigo-400" />
              ) : themePreference === 'auto_time' ? (
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Laptop className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Top Brand Bar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between transition-colors duration-200">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          <HimalehLogo variant="horizontal" size={32} showTagline={false} />
        </div>
        <div className="flex items-center gap-2">
          <button
            id="quick-theme-toggle-mobile"
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            title={`Theme: ${themePreference === 'auto_time' ? 'AUTO BY TIME' : themePreference.toUpperCase()} (Tap to cycle themes)`}
            aria-label={`Current theme is ${themePreference}. Tap to cycle themes.`}
          >
            {themePreference === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : themePreference === 'dark' ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : themePreference === 'auto_time' ? (
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Laptop className="h-4 w-4 text-neutral-400" />
            )}
          </button>
          <span className="text-[11px] font-bold capitalize text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200/70 dark:border-amber-800/60">
            {currentScreen}
          </span>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Fixed Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-safe transition-colors duration-200">
        <div className="grid grid-cols-5 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentScreen === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-nav-tab-${tab.id}`}
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1 text-center transition cursor-pointer ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

