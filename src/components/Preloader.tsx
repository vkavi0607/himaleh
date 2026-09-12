import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { HimalehLogo } from './HimalehLogo';
import { useTheme } from '../theme/ThemeContext';

interface PreloaderProps {
  onComplete: () => void;
  onInitialize?: () => Promise<void>;
  reduceMotion?: boolean;
  isDarkMode?: boolean;
}

/**
 * Premium Minimum Visible Duration (1.8s – 2.2s)
 * Set to 2000ms (2.0 seconds) to ensure a calm, deliberate, cinematic startup.
 */
const MIN_VISIBLE_DURATION_MS = 2000;

/**
 * Exit Transition Duration (300ms – 450ms)
 * 380ms provides a continuous, fluid transition into the Dashboard.
 */
const EXIT_TRANSITION_DURATION_MS = 380;

export const Preloader: React.FC<PreloaderProps> = ({
  onComplete,
  onInitialize,
  reduceMotion = false,
  isDarkMode,
}) => {
  const { isDark } = useTheme();
  const activeDark = isDarkMode !== undefined ? isDarkMode : isDark;

  // Lifecycle States
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [statusText, setStatusText] = useState('Ascending to today’s trail...');

  // Timer and callback references
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);

  const onInitializeRef = useRef(onInitialize);
  useEffect(() => {
    onInitializeRef.current = onInitialize;
  }, [onInitialize]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  const runStartupSequence = useCallback(async () => {
    if (!isMountedRef.current) return;

    setHasError(false);
    setErrorMessage(null);
    setIsSettled(false);
    setIsExiting(false);
    setStatusText('Ascending to today’s trail...');

    try {
      // 1. Real Initialization Promise
      const initFn = onInitializeRef.current;
      const initPromise = initFn ? initFn() : Promise.resolve();

      // 2. Premium Minimum Duration Promise (1.8s – 2.2s)
      const minDurationPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, MIN_VISIBLE_DURATION_MS);
      });

      // 3. Await both real initialization AND minimum display time.
      // - Fast device (< 2s): remains visible until min duration finishes smoothly.
      // - Slow device (> 2s): continues continuous animation without restarting until real init completes.
      await Promise.all([initPromise, minDurationPromise]);

      if (!isMountedRef.current) return;

      // 4. Logo slightly settles
      setIsSettled(true);
      setStatusText('Ready.');

      // 5. Smooth Settling Beat (60ms) followed by Exit Transition (380ms)
      settleTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setIsExiting(true);

        exitTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, EXIT_TRANSITION_DURATION_MS);
      }, 60);
    } catch (err: unknown) {
      console.error('Himaleh initialization failed:', err);
      if (!isMountedRef.current) return;
      setHasError(true);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong while opening your local vault.'
      );
    }
  }, []);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      runStartupSequence();
    }
  }, [runStartupSequence]);

  return (
    <aside
      id="himaleh-preloader"
      role="status"
      aria-live="polite"
      aria-label="Himaleh loading"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden ${
        reduceMotion
          ? 'transition-opacity duration-300'
          : 'transition-all duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
      } ${
        isExiting
          ? reduceMotion
            ? 'opacity-0 pointer-events-none'
            : 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100'
      } ${
        activeDark
          ? 'bg-[#0B0F19] text-slate-50'
          : 'bg-[#F8F9FA] text-slate-900'
      }`}
    >
      {/* Background Subtle Ambient Gradient */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          activeDark
            ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(30,41,59,0.45)_0%,rgba(11,15,25,1)_70%)]'
            : 'bg-[radial-gradient(circle_at_50%_40%,rgba(241,245,249,0.9)_0%,rgba(248,249,250,1)_70%)]'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* =====================================================================
            LOGO CONTAINER WITH CHOREOGRAPHED SEQUENCE:
            0.2s: Logo fades/scales in
            0.5s: Subtle glow / breathing animation
            ===================================================================== */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Subtle Logo Glow / Breathing (0.5s) */}
          {!reduceMotion && !hasError && (
            <div
              className={`absolute -inset-10 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                isSettled ? 'opacity-30 scale-95' : 'himaleh-preloader-glow'
              } ${
                activeDark
                  ? 'bg-gradient-to-tr from-amber-500/15 via-indigo-500/10 to-transparent'
                  : 'bg-gradient-to-tr from-amber-400/20 via-indigo-400/10 to-transparent'
              }`}
            />
          )}

          {/* Official Himaleh Mountain Crest (0.2s entrance, settling at final) */}
          <div
            className={`relative transform transition-transform duration-500 ${
              reduceMotion
                ? 'opacity-100'
                : isSettled
                ? 'scale-100 transition-transform duration-300'
                : 'himaleh-preloader-crest'
            }`}
          >
            <HimalehLogo
              variant="crest"
              theme={activeDark ? 'dark' : 'light'}
              size={104}
              animated={!reduceMotion}
            />
          </div>
        </div>

        {/* =====================================================================
            BRAND TEXT SEQUENCE (0.8s entrance)
            "Himaleh" display serif + "TRACK • IMPROVE • ACHIEVE" tagline
            ===================================================================== */}
        <div
          className={`mt-4 flex flex-col items-center select-none ${
            reduceMotion ? 'opacity-100' : 'himaleh-preloader-text'
          }`}
        >
          <span
            className={`font-serif tracking-tight font-black text-3xl sm:text-4xl leading-tight ${
              activeDark ? 'text-slate-50' : 'text-slate-900'
            }`}
            style={{
              fontFamily: '"Plus Jakarta Sans", "Cinzel", Georgia, serif',
              letterSpacing: '-0.03em',
            }}
          >
            Himaleh
          </span>
          <span
            className={`font-sans tracking-[0.28em] uppercase font-bold text-[10px] mt-1.5 ${
              activeDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Track • Improve • Achieve
          </span>
        </div>

        {/* =====================================================================
            SUBTLE LOADING ANIMATION (1.0s – 1.8s) & REAL STATUS
            - Golden alpine trail pulse bar (hairline, continuous shimmer)
            - No aggressive spinners
            - No fake loading percentage
            ===================================================================== */}
        {!hasError ? (
          <div
            className={`w-full max-w-[170px] space-y-2.5 pt-5 ${
              reduceMotion ? 'opacity-100' : 'himaleh-preloader-bar'
            }`}
          >
            {/* Minimalist Golden Alpine Trail Line */}
            <div className="h-[2px] w-full bg-slate-200/90 dark:bg-slate-800/90 rounded-full overflow-hidden relative shadow-xs">
              <div
                className={`h-full rounded-full ${
                  reduceMotion
                    ? 'w-full bg-amber-500/80'
                    : 'w-2/5 bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 himaleh-preloader-shimmer'
                }`}
              />
            </div>

            {/* Quiet status phrase (No fake percentages) */}
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono tracking-wide transition-opacity duration-300">
              {statusText}
            </p>
          </div>
        ) : (
          /* =====================================================================
             ERROR STATE (Specification 7)
             "Something went wrong" + [Try Again] button
             ===================================================================== */
          <div className="space-y-3.5 p-5 mt-6 rounded-2xl bg-rose-50/95 dark:bg-rose-950/50 border border-rose-200/90 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 max-w-xs w-full shadow-lg animate-fade-in">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold tracking-tight">Something went wrong</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300/90 text-center leading-relaxed">
                {errorMessage || 'Unable to open your local vault. Please try again.'}
              </p>
            </div>
            <div className="pt-1">
              <button
                id="preloader-retry-button"
                type="button"
                onClick={runStartupSequence}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
