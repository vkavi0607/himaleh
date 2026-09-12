import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Star, AlertTriangle, Target, Clock } from 'lucide-react';
import { SmartInsightItem } from '../../domain/AnalyticsCalculationEngine';

interface SmartInsightsSectionProps {
  insights: SmartInsightItem[];
  hasHistory: boolean;
}

export const SmartInsightsSection: React.FC<SmartInsightsSectionProps> = ({
  insights,
  hasHistory,
}) => {
  const getIcon = (type: SmartInsightItem['iconType']) => {
    switch (type) {
      case 'trend_up':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'trend_down':
        return <TrendingDown className="h-4 w-4 text-amber-500" />;
      case 'day_star':
        return <Star className="h-4 w-4 text-amber-400 fill-amber-400" />;
      case 'caution':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'target':
        return <Target className="h-4 w-4 text-indigo-500" />;
      case 'time':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-amber-500" />;
    }
  };

  const getBorderAndBg = (accent: SmartInsightItem['accent']) => {
    switch (accent) {
      case 'emerald':
        return 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'amber':
        return 'border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20';
      case 'rose':
        return 'border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20';
      case 'indigo':
        return 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20';
      case 'gold':
      default:
        return 'border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20';
    }
  };

  return (
    <div
      id="smart-insights-section"
      className="rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Intelligent Performance Insights
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Automated mathematical analysis answering: How am I doing? Am I improving? Where am I weak? What next?
          </p>
        </div>
      </div>

      {/* Content */}
      {!hasHistory || insights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-1.5">
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Keep tracking to unlock personalized insights.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
            As you log routines over multiple days, Himaleh computes your peak performance days, identifies friction points, and recommends targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-2xl border ${getBorderAndBg(
                insight.accent
              )} space-y-1.5 transition-all`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white dark:bg-neutral-900 shadow-2xs">
                    {getIcon(insight.iconType)}
                  </div>
                  <h3 className="text-xs font-black text-neutral-900 dark:text-neutral-100">
                    {insight.title}
                  </h3>
                </div>

                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-neutral-900/80 text-neutral-500 border border-neutral-200/60 dark:border-neutral-700/60">
                  {insight.category}
                </span>
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
