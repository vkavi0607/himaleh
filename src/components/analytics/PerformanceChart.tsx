import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import { DayPerformancePoint, TimeRangeKey } from '../../domain/AnalyticsCalculationEngine';

interface PerformanceChartProps {
  days: DayPerformancePoint[];
  range: TimeRangeKey;
  onSelectDatePoint: (point: DayPerformancePoint) => void;
  reduceMotion?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  days,
  range,
  onSelectDatePoint,
  reduceMotion = false,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DayPerformancePoint | null>(null);

  // Group or sample days if range is 90D or ALL so it fits cleanly or scroll comfortably
  const isScrollable = range === '90D' || range === 'ALL';

  return (
    <div
      id="performance-chart-card"
      className="rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Daily Completion Performance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tap any day to inspect planned, completed, and skipped routines
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Missed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Skipped
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            Rest
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-2">
        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="mb-2 p-2.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs shadow-lg flex items-center justify-between animate-fade-in pointer-events-none">
            <div className="space-y-0.5">
              <span className="font-bold">{hoveredPoint.date}</span>
              <span className="text-neutral-400 dark:text-neutral-600 ml-2">({hoveredPoint.dayLabel})</span>
            </div>
            <div className="font-bold flex items-center gap-2">
              {hoveredPoint.totalPlanned === 0 ? (
                <span className="text-neutral-400 dark:text-neutral-600">Rest Day (0 planned)</span>
              ) : (
                <span>
                  {hoveredPoint.completedCount} / {hoveredPoint.totalPlanned} Done ({Math.round(hoveredPoint.percentage)}%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bars Container */}
        <div className={`flex items-end gap-1.5 sm:gap-2 pb-2 ${isScrollable ? 'overflow-x-auto min-w-full' : ''}`}>
          {days.map((dp) => {
            const hasRoutines = dp.totalPlanned > 0;
            const pct = hasRoutines ? Math.round(dp.percentage) : 0;
            const isRest = dp.totalPlanned === 0;

            // Height math: scale between 20px and 140px
            const barHeight = isRest ? 24 : Math.max(28, Math.round((pct / 100) * 140));

            let barColor = 'bg-neutral-200 dark:bg-neutral-800';
            let statusBorder = 'border-transparent';

            if (dp.status === 'COMPLETED') {
              barColor = 'bg-emerald-500 hover:bg-emerald-600';
            } else if (dp.status === 'PARTIAL') {
              barColor = 'bg-amber-500 hover:bg-amber-600';
            } else if (dp.status === 'MISSED') {
              barColor = 'bg-rose-500 hover:bg-rose-600';
            } else if (dp.status === 'SKIPPED') {
              barColor = 'bg-slate-400 hover:bg-slate-500';
            } else {
              barColor = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400';
              statusBorder = 'border border-dashed border-neutral-300 dark:border-neutral-700';
            }

            return (
              <button
                key={dp.date}
                type="button"
                onClick={() => onSelectDatePoint(dp)}
                onMouseEnter={() => setHoveredPoint(dp)}
                onMouseLeave={() => setHoveredPoint(null)}
                aria-label={`Performance for ${dp.date}: ${pct}% completed`}
                className={`group relative flex flex-col items-center justify-end rounded-2xl p-1 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                  isScrollable ? 'w-9 shrink-0' : 'flex-1 min-w-[28px]'
                }`}
              >
                {/* Bar */}
                <div
                  style={{ height: `${barHeight}px` }}
                  className={`w-full rounded-xl transition-all ${barColor} ${statusBorder} ${
                    reduceMotion ? '' : 'group-hover:scale-105 active:scale-95'
                  } shadow-2xs flex flex-col justify-end p-1`}
                >
                  {/* Percentage or Rest label inside tall bars */}
                  {barHeight > 50 && (
                    <span className="text-[10px] font-black text-white text-center drop-shadow-xs">
                      {pct}%
                    </span>
                  )}
                </div>

                {/* Date Label under bar */}
                <div className="mt-2 text-center">
                  <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                    {dp.dayLabel.slice(0, 3)}
                  </span>
                  <span className="block text-xs font-black text-neutral-700 dark:text-neutral-300">
                    {dp.dateNum}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Touch helper note */}
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 pt-1">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>Tap any date column above to view individual habits, skips, and reflection notes.</span>
      </div>
    </div>
  );
};
