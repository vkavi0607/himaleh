import React from 'react';
import { Flame, Trophy, TrendingUp, TrendingDown, Minus, CheckCircle2, Target } from 'lucide-react';
import { HimalehLogo } from '../HimalehLogo';

interface AnalyticsHeroCardProps {
  consistencyPct: number;
  trendVsPrevious: number | null;
  previousPeriodLabel: string;
  currentStreak: number;
  longestStreak: number;
  successfulDays: number;
  activeDays: number;
  activeGoalsCount: number;
  avgGoalProgressPct: number;
  reduceMotion?: boolean;
}

export const AnalyticsHeroCard: React.FC<AnalyticsHeroCardProps> = ({
  consistencyPct,
  trendVsPrevious,
  previousPeriodLabel,
  currentStreak,
  longestStreak,
  successfulDays,
  activeDays,
  activeGoalsCount,
  avgGoalProgressPct,
  reduceMotion = false,
}) => {
  // SVG Circular Gauge Calculations
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, consistencyPct)) / 100) * circumference;

  return (
    <div
      id="analytics-hero-card"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-amber-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-amber-950/20 p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-all"
    >
      {/* Background Decorative Summit Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-56 w-56 rounded-full bg-amber-400/10 dark:bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-44 w-44 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Subtle Himaleh Mountain Watermark */}
      <div className="absolute top-4 right-4 opacity-5 dark:opacity-10 pointer-events-none">
        <HimalehLogo variant="crest" size={96} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8">
        {/* Left / Center: Large Radial Progress Gauge */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
              Himaleh Performance Core
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            {/* SVG Circular Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-neutral-100 dark:text-neutral-800"
                />
                {/* Progress Ring with Gold/Amber/Emerald Gradient */}
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="60%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="url(#heroGradient)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className={`transition-all duration-1000 ease-out ${reduceMotion ? '' : 'animate-pulse-slow'}`}
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight font-display">
                  {consistencyPct}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Consistency
                </span>
              </div>
            </div>

            {/* Core Trend and Context */}
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                Your Trail Consistency
              </h2>

              {/* Trend Pill */}
              <div className="flex items-center justify-center sm:justify-start">
                {trendVsPrevious !== null ? (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      trendVsPrevious > 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : trendVsPrevious < 0
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {trendVsPrevious > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : trendVsPrevious < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {trendVsPrevious > 0 ? `+${trendVsPrevious}%` : `${trendVsPrevious}%`}{' '}
                      vs {previousPeriodLabel}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    <span>Initial baseline period</span>
                  </div>
                )}
              </div>

              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 max-w-xs">
                {activeDays > 0
                  ? `${successfulDays} of ${activeDays} scheduled days scaled to 100% completion.`
                  : 'No scheduled routine days in this period.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Key Performance Pillars Grid */}
        <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-3 shrink-0">
          {/* Current Streak */}
          <div className="bg-white/80 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-1 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4 fill-orange-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {currentStreak}
              </span>
              <span className="text-xs text-neutral-500 font-semibold">days</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium truncate">
              {currentStreak > 0 ? 'Active ascension' : 'Ready to start'}
            </p>
          </div>

          {/* Personal Best Streak */}
          <div className="bg-white/80 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-1 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Best</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {longestStreak}
              </span>
              <span className="text-xs text-neutral-500 font-semibold">days</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium truncate">Personal record</p>
          </div>

          {/* Successful Days */}
          <div className="bg-white/80 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-1 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Mastered</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {successfulDays}
              </span>
              <span className="text-xs text-neutral-500 font-semibold">/ {activeDays} days</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium truncate">100% complete days</p>
          </div>

          {/* Goal Trajectory */}
          <div className="bg-white/80 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-1 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Target className="h-4 w-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Goals</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {activeGoalsCount > 0 ? `${avgGoalProgressPct}%` : '0%'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium truncate">
              {activeGoalsCount > 0 ? `${activeGoalsCount} active goals` : 'No active goals'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
