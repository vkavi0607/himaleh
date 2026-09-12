import React from 'react';
import { Calendar } from 'lucide-react';
import { DayPerformancePoint } from '../../domain/AnalyticsCalculationEngine';

interface ConsistencyHeatmapProps {
  days: DayPerformancePoint[];
  onSelectDatePoint: (point: DayPerformancePoint) => void;
  reduceMotion?: boolean;
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({
  days,
  onSelectDatePoint,
  reduceMotion = false,
}) => {
  return (
    <div
      id="consistency-heatmap-card"
      className="rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Consistency Trail Heatmap
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Visual frequency and intensity across your historical timeline
            </p>
          </div>
        </div>

        {/* Heatmap intensity legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
          <span>Less</span>
          <div className="h-3 w-3 rounded-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" title="Rest / No Planned Routines" />
          <div className="h-3 w-3 rounded-xs bg-rose-400 dark:bg-rose-600" title="Missed Routines" />
          <div className="h-3 w-3 rounded-xs bg-slate-400 dark:bg-slate-500" title="Skipped Routines" />
          <div className="h-3 w-3 rounded-xs bg-amber-400 dark:bg-amber-500" title="Partial Completion" />
          <div className="h-3 w-3 rounded-xs bg-emerald-400 dark:bg-emerald-500" title="High Completion (>75%)" />
          <div className="h-3 w-3 rounded-xs bg-emerald-600 dark:bg-emerald-400" title="100% Fully Scaled" />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[340px] grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
          {days.map((dp) => {
            const hasPlanned = dp.totalPlanned > 0;
            const pct = Math.round(dp.percentage);

            let cellClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60';
            let label = `${dp.date}: Rest Day`;

            if (hasPlanned) {
              if (dp.completedCount >= dp.totalPlanned) {
                cellClass = 'bg-emerald-600 text-white font-black shadow-xs';
                label = `${dp.date}: 100% Mastered (${dp.completedCount}/${dp.totalPlanned})`;
              } else if (pct >= 75) {
                cellClass = 'bg-emerald-500 text-white font-bold';
                label = `${dp.date}: ${pct}% Completed (${dp.completedCount}/${dp.totalPlanned})`;
              } else if (pct > 0) {
                cellClass = 'bg-amber-500 text-white font-bold';
                label = `${dp.date}: Partial ${pct}% (${dp.completedCount}/${dp.totalPlanned})`;
              } else if (dp.skippedCount === dp.totalPlanned) {
                cellClass = 'bg-slate-400 text-white font-bold';
                label = `${dp.date}: Intentionally Skipped (${dp.skippedCount} routines)`;
              } else {
                cellClass = 'bg-rose-500 text-white font-bold';
                label = `${dp.date}: Incomplete/Missed (${dp.missedCount} missed)`;
              }
            }

            return (
              <button
                key={dp.date}
                type="button"
                onClick={() => onSelectDatePoint(dp)}
                title={label}
                className={`relative flex flex-col items-center justify-between p-2 rounded-2xl min-h-[58px] transition-all cursor-pointer ${cellClass} ${
                  reduceMotion ? '' : 'hover:scale-105 active:scale-95'
                } focus:outline-hidden focus:ring-2 focus:ring-amber-500`}
              >
                <div className="w-full flex items-center justify-between text-[9px] opacity-75">
                  <span className="font-bold uppercase">{dp.dayLabel.slice(0, 1)}</span>
                  <span>{dp.dateNum}</span>
                </div>

                <div className="my-0.5 text-center">
                  {hasPlanned ? (
                    <span className="text-[10px] font-black leading-none">
                      {dp.completedCount >= dp.totalPlanned ? '✓' : `${pct}%`}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold opacity-60">Rest</span>
                  )}
                </div>

                <div className="w-full flex justify-center">
                  <span className="text-[8px] opacity-80 leading-none">
                    {hasPlanned ? `${dp.completedCount}/${dp.totalPlanned}` : '—'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
