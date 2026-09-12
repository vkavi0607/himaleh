import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { HimalehLogo } from './HimalehLogo';

interface PreloaderProps {
  onComplete: () => void;
  onInitialize?: () => Promise<void>;
  reduceMotion?: boolean;
  isDarkMode?: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({
  onComplete,
  onInitialize,
  reduceMotion = false,
  isDarkMode = false,
}) => {
  const [stepText, setStepText] = useState('Opening secure local vault...');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const runStartupSequence = useCallback(async () => {
    setHasError(false);
    setErrorMessage(null);

    try {
      if (reduceMotion) {
        // Fast start with no delay for reduced motion preference
        if (onInitialize) {
          await onInitialize();
        }
        setIsFadingOut(true);
        setTimeout(onComplete, 120);
        return;
      }

      setStepText('Loading user data...');
      await new Promise((r) => setTimeout(r, 80));

      setStepText("Loading today's routines & goals...");
      if (onInitialize) {
        await onInitialize();
      } else {
        await new Promise((r) => setTimeout(r, 100));
      }

      setStepText('Calculating progress & reminder state...');
      await new Promise((r) => setTimeout(r, 80));

      setStepText('Ready.');

      // Smooth fast exit
      setIsFadingOut(true);
      setTimeout(onComplete, 200);
    } catch (err: unknown) {
      console.error('Himaleh initialization failed:', err);
      setHasError(true);
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong while preparing your data.'
      );
    }
  }, [onInitialize, reduceMotion, onComplete]);

  useEffect(() => {
    runStartupSequence();
  }, [runStartupSequence]);

  return (
    <div
      id="himaleh-preloader"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isDarkMode
          ? 'bg-[#070B14] text-slate-50'
          : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full px-6 text-center space-y-6">
        {/* Official Himaleh Mountain Logo */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Subtle Golden Summit Ambient Glow */}
          {!reduceMotion && (
            <div
              className={`absolute -inset-8 rounded-full blur-3xl transition-opacity pointer-events-none ${
                isDarkMode ? 'bg-amber-500/15' : 'bg-amber-400/20'
              }`}
            />
          )}

          {/* Official Himaleh Logo Lockup */}
          <div className="relative transform transition-transform">
            <HimalehLogo
              variant="full"
              theme={isDarkMode ? 'dark' : 'light'}
              size={135}
              animated={!reduceMotion}
              showTagline={true}
            />
          </div>
        </div>

        {/* Real Loading State / Feedback */}
        {!hasError ? (
          <div className="w-full max-w-[220px] space-y-3 pt-2">
            {/* Minimalist Indeterminate Golden Trail Pulse Bar */}
            <div className="h-1.5 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner relative">
              <div
                className={`h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full ${
                  reduceMotion ? 'w-full' : 'w-1/2 animate-[shimmer_1.5s_infinite_linear]'
                }`}
                style={{
                  animation: reduceMotion ? 'none' : 'indeterminate 1.4s infinite ease-in-out',
                }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono tracking-wide transition-opacity">
              {stepText}
            </p>
          </div>
        ) : (
          /* Premium Initialization Error State */
          <div className="space-y-3 p-5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 max-w-xs w-full shadow-lg">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Unable to load Himaleh</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300/90 text-center">
                {errorMessage || 'Something went wrong while preparing your data.'}
              </p>
            </div>
            <div className="pt-1">
              <button
                id="preloader-retry-button"
                type="button"
                onClick={runStartupSequence}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
