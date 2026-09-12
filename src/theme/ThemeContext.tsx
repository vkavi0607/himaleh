import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HimalehThemeTokens, getThemeTokens, lightThemeTokens } from './brandTokens';
import { StorageService } from '../data/storage';
import { isDarkBySchedule, getNextThemeChange, NextThemeChangeInfo } from '../domain/ThemeScheduleEngine';

export type ThemePreference = 'light' | 'dark' | 'system' | 'auto_time';

export interface ThemeContextValue {
  themePreference: ThemePreference;
  isDark: boolean;
  tokens: HimalehThemeTokens;
  automaticLightTime: string;
  automaticDarkTime: string;
  nextThemeChange: NextThemeChangeInfo | null;
  setThemePreference: (theme: ThemePreference) => void;
  setAutomaticTimes: (lightTime: string, darkTime: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themePreference: 'system',
  isDark: false,
  tokens: lightThemeTokens,
  automaticLightTime: '06:00',
  automaticDarkTime: '18:00',
  nextThemeChange: null,
  setThemePreference: () => {},
  setAutomaticTimes: () => {},
  toggleTheme: () => {},
});

/**
 * Checks Android / OS system prefers-color-scheme in real-time.
 */
export const resolveSystemIsDark = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

/**
 * Derives whether Dark mode should be active based on:
 * - Selected theme preference
 * - Current real local device time (for 'auto_time')
 * - Real system setting (for 'system')
 */
export const resolveIsDark = (
  pref: ThemePreference,
  lightTime = '06:00',
  darkTime = '18:00',
  currentDate: Date = new Date()
): boolean => {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  if (pref === 'auto_time') {
    return isDarkBySchedule(currentDate, lightTime, darkTime);
  }
  return resolveSystemIsDark();
};

/**
 * Updates DOM root classes, styles, and mobile status bar / browser navigation bar meta tags.
 */
export const applyThemeToDom = (isDark: boolean, tokens: HimalehThemeTokens): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // 1. Mobile Android / Chrome status bar & browser toolbar color
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', tokens.statusBarBackground);

  // 2. iOS Status bar appearance
  let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!metaApple) {
    metaApple = document.createElement('meta');
    metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(metaApple);
  }
  metaApple.setAttribute('content', isDark ? 'black-translucent' : 'default');
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read saved settings
  const initialSettings = useMemo(() => {
    try {
      return StorageService.getSettings();
    } catch {
      return null;
    }
  }, []);

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    if (initialSettings?.theme) {
      return initialSettings.theme as ThemePreference;
    }
    return 'system';
  });

  const [automaticLightTime, setAutomaticLightTimeState] = useState<string>(
    initialSettings?.automaticLightTime || '06:00'
  );
  const [automaticDarkTime, setAutomaticDarkTimeState] = useState<string>(
    initialSettings?.automaticDarkTime || '18:00'
  );

  const [systemIsDark, setSystemIsDark] = useState<boolean>(resolveSystemIsDark);

  // Real device local time state for continuous synchronization
  const [currentLocalTime, setCurrentLocalTime] = useState<Date>(() => new Date());

  // Tracks time for scheduling precision
  const lightTimeRef = useRef(automaticLightTime);
  lightTimeRef.current = automaticLightTime;
  const darkTimeRef = useRef(automaticDarkTime);
  darkTimeRef.current = automaticDarkTime;
  const themePrefRef = useRef(themePreference);
  themePrefRef.current = themePreference;

  // Compute resolved dark mode state
  const isDark = useMemo(() => {
    if (themePreference === 'dark') return true;
    if (themePreference === 'light') return false;
    if (themePreference === 'system') return systemIsDark;
    if (themePreference === 'auto_time') {
      return isDarkBySchedule(currentLocalTime, automaticLightTime, automaticDarkTime);
    }
    return systemIsDark;
  }, [themePreference, systemIsDark, currentLocalTime, automaticLightTime, automaticDarkTime]);

  // Compute active tokens
  const tokens = useMemo(() => {
    return getThemeTokens(isDark);
  }, [isDark]);

  // Next theme change calculation
  const nextThemeChange = useMemo(() => {
    if (themePreference !== 'auto_time') return null;
    return getNextThemeChange(currentLocalTime, automaticLightTime, automaticDarkTime);
  }, [themePreference, currentLocalTime, automaticLightTime, automaticDarkTime]);

  // Apply DOM side effects whenever isDark or tokens change
  useEffect(() => {
    applyThemeToDom(isDark, tokens);
  }, [isDark, tokens]);

  // Helper to re-evaluate time against current clock
  const checkCurrentTime = useCallback(() => {
    const now = new Date();
    setCurrentLocalTime(now);
  }, []);

  // 1. Real-time Interval Check: Checks real system time every 5 seconds
  // This guarantees that at 06:00, 18:00, or exact scheduled moments, the theme updates within seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkCurrentTime();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkCurrentTime]);

  // 2. Lifecycle & Background Detection:
  // Immediately recalculates theme when user switches back to the tab/app from background
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App returned from background -> re-evaluate local clock immediately
        checkCurrentTime();
      }
    };

    const handleWindowFocus = () => {
      checkCurrentTime();
    };

    const handleOnline = () => {
      checkCurrentTime();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkCurrentTime]);

  // 3. Listen to Android / OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if ('addListener' in mediaQuery) {
      (mediaQuery as unknown as { addListener: (listener: (e: MediaQueryListEvent) => void) => void }).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if ('removeListener' in mediaQuery) {
        (mediaQuery as unknown as { removeListener: (listener: (e: MediaQueryListEvent) => void) => void }).removeListener(handleChange);
      }
    };
  }, []);

  // Update theme preference handler with instant storage persistence
  const setThemePreference = useCallback((newPref: ThemePreference) => {
    setThemePreferenceState(newPref);
    const now = new Date();
    setCurrentLocalTime(now);

    const calculatedIsDark = resolveIsDark(newPref, lightTimeRef.current, darkTimeRef.current, now);
    const newTokens = getThemeTokens(calculatedIsDark);
    applyThemeToDom(calculatedIsDark, newTokens);

    try {
      const currentSettings = StorageService.getSettings();
      StorageService.saveSettings({
        ...currentSettings,
        theme: newPref,
        automaticLightTime: lightTimeRef.current,
        automaticDarkTime: darkTimeRef.current,
        isDarkMode: calculatedIsDark,
      });
    } catch {
      // safe fallback
    }
  }, []);

  // Configure custom automatic Light & Dark times
  const setAutomaticTimes = useCallback((newLightTime: string, newDarkTime: string) => {
    setAutomaticLightTimeState(newLightTime);
    setAutomaticDarkTimeState(newDarkTime);
    lightTimeRef.current = newLightTime;
    darkTimeRef.current = newDarkTime;

    const now = new Date();
    setCurrentLocalTime(now);

    if (themePrefRef.current === 'auto_time') {
      const calculatedIsDark = isDarkBySchedule(now, newLightTime, newDarkTime);
      const newTokens = getThemeTokens(calculatedIsDark);
      applyThemeToDom(calculatedIsDark, newTokens);
    }

    try {
      const currentSettings = StorageService.getSettings();
      StorageService.saveSettings({
        ...currentSettings,
        automaticLightTime: newLightTime,
        automaticDarkTime: newDarkTime,
      });
    } catch {
      // safe fallback
    }
  }, []);

  // Quick toggle between Light, Dark, System, and Automatic by Time
  const toggleTheme = useCallback(() => {
    if (themePreference === 'light') {
      setThemePreference('dark');
    } else if (themePreference === 'dark') {
      setThemePreference('system');
    } else if (themePreference === 'system') {
      setThemePreference('auto_time');
    } else {
      setThemePreference('light');
    }
  }, [themePreference, setThemePreference]);

  const value = useMemo(
    () => ({
      themePreference,
      isDark,
      tokens,
      automaticLightTime,
      automaticDarkTime,
      nextThemeChange,
      setThemePreference,
      setAutomaticTimes,
      toggleTheme,
    }),
    [
      themePreference,
      isDark,
      tokens,
      automaticLightTime,
      automaticDarkTime,
      nextThemeChange,
      setThemePreference,
      setAutomaticTimes,
      toggleTheme,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext);
};
