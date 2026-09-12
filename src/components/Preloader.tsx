import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { HimalehLogo } from './HimalehLogo';

interface PreloaderProps {
  onComplete: () => void;
  reduceMotion?: boolean;
  isDarkMode?: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({
  onComplete,
  reduceMotion = false,
  isDarkMode = false,
}) => {
  const [progress, setProgress] = useState(15);
  const [stepText, setStepText] = useState('Restoring offline state...');
  const [hasError, setHasError] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      // Instant startup if user prefers reduced motion
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(onComplete, 140);
      }, 250);
      return () => clearTimeout(timer);
    }

    // Step 1: 15% -> 45%
    const t1 = setTimeout(() => {
      setProgress(45);
      setStepText('Calibrating consistency engine...');
    }, 180);

    // Step 2: 45% -> 85%
    const t2 = setTimeout(() => {
      setProgress(85);
      setStepText('Preparing daily execution ledger...');
    }, 380);

    // Step 3: 85% -> 100%
    const t3 = setTimeout(() => {
      setProgress(100);
      setStepText('The Summit Awaits.');
    }, 580);

    // Fade out and finish smoothly
    const t4 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onComplete, 220);
    }, 760);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [reduceMotion, onComplete]);

  const handleRetry = () => {
    setHasError(false);
    setProgress(20);
    setStepText('Re-initializing storage...');
    setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
      setTimeout(onComplete, 180);
    }, 350);
  };

  return (
    <div
      id="himaleh-preloader"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isDarkMode
          ? 'bg-slate-950 text-slate-50'
          : 'bg-gradient-to-b from-slate-50 via-white to-amber-50/20 text-slate-900'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full px-6 text-center space-y-6">
        {/* Official Himaleh Mountain Logo */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Subtle Golden Summit Glow */}
          <div
            className={`absolute -inset-6 rounded-full blur-2xl transition-opacity pointer-events-none ${
              isDarkMode ? 'bg-amber-500/15' : 'bg-amber-400/25'
            }`}
          />

          {/* Official Himaleh Logo Lockup */}
          <div className="relative transform transition-transform">
            <HimalehLogo
              variant="full"
              theme={isDarkMode ? 'dark' : 'light'}
              size={130}
              animated={!reduceMotion}
              showTagline={true}
            />
          </div>
        </div>

        {/* Loading Progress & Status Bar with Golden Trail Palette */}
        {!hasError ? (
          <div className="w-full max-w-[220px] space-y-2.5 pt-2">
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 transition-all font-mono tracking-wide">
              {stepText}
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>Something went wrong while loading Himaleh.</span>
            </div>
            <button
              id="preloader-retry-button"
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
