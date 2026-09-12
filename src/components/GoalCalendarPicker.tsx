import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';

interface GoalCalendarPickerProps {
  startDate: string;
  endDate: string;
  onSelectDates: (start: string, end: string) => void;
  onClose: () => void;
}

export const GoalCalendarPicker: React.FC<GoalCalendarPickerProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onSelectDates,
  onClose,
}) => {
  const todayStr = ProgressCalculationEngine.getTodayStr();

  const [activePickingMode, setActivePickingMode] = useState<'start' | 'end'>('end');
  const [tempStart, setTempStart] = useState<string>(initialStartDate || todayStr);
  const [tempEnd, setTempEnd] = useState<string>(
    initialEndDate || ProgressCalculationEngine.addDays(todayStr, 30)
  );

  // Initialize view month based on active pick target
  const initialDateObj = new Date((initialEndDate || initialStartDate || todayStr) + 'T00:00:00');
  const [viewYear, setViewYear] = useState<number>(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDateObj.getMonth()); // 0-indexed

  // Validation
  let validationError: string | null = null;
  if (!tempStart) {
    validationError = 'Start date is required';
  } else if (!tempEnd) {
    validationError = 'End date is required';
  } else if (tempEnd < tempStart) {
    validationError = 'End date cannot be earlier than start date';
  }

  // Quick Preset Handlers
  const applyPreset = (days: number) => {
    const start = tempStart || todayStr;
    const end = ProgressCalculationEngine.addDays(start, days);
    setTempStart(start);
    setTempEnd(end);
    // Move view month to end date
    const endDateObj = new Date(end + 'T00:00:00');
    setViewYear(endDateObj.getFullYear());
    setViewMonth(endDateObj.getMonth());
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (activePickingMode === 'start') {
      setTempStart(dateStr);
      // If new start date is after end date, automatically adjust end date
      if (tempEnd && dateStr > tempEnd) {
        setTempEnd(ProgressCalculationEngine.addDays(dateStr, 30));
      }
      setActivePickingMode('end');
    } else {
      if (tempStart && dateStr < tempStart) {
        // User clicked before start date while in end mode: auto-switch start date
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleConfirm = () => {
    if (!validationError && tempStart && tempEnd) {
      onSelectDates(tempStart, tempEnd);
      onClose();
    }
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  // We want Monday = 0, Sunday = 6
  const startCol = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayShortNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div
      id="goal-calendar-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="goal-calendar-modal-container"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 font-display">
                Select Goal Timeline
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Choose start date and completion target
              </p>
            </div>
          </div>
          <button
            id="close-calendar-button"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close calendar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Target Pick Switcher Tabs (Start Date vs End Date) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
            <button
              id="calendar-pick-start-tab"
              type="button"
              onClick={() => {
                setActivePickingMode('start');
                if (tempStart) {
                  const d = new Date(tempStart + 'T00:00:00');
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                activePickingMode === 'start'
                  ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-75">Start Date</span>
              <span className="font-mono text-xs font-bold">{tempStart || 'Select'}</span>
            </button>

            <button
              id="calendar-pick-end-tab"
              type="button"
              onClick={() => {
                setActivePickingMode('end');
                if (tempEnd) {
                  const d = new Date(tempEnd + 'T00:00:00');
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                activePickingMode === 'end'
                  ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-75">End Target Date</span>
              <span className="font-mono text-xs font-bold">{tempEnd || 'Select'}</span>
            </button>
          </div>

          {/* Quick Duration Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Quick Duration Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '30 Days', days: 30 },
                { label: '60 Days', days: 60 },
                { label: '90 Days', days: 90 },
                { label: '6 Months', days: 180 },
                { label: '1 Year', days: 365 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => applyPreset(preset.days)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 font-display">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center">
              {weekdayShortNames.map((d, i) => (
                <span
                  key={d}
                  className={`text-[10px] font-bold py-1 ${
                    i >= 5 ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank cells for offset */}
              {Array.from({ length: startCol }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-8 w-full" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const monthStr = String(viewMonth + 1).padStart(2, '0');
                const dayStr = String(day).padStart(2, '0');
                const cellDate = `${viewYear}-${monthStr}-${dayStr}`;

                const isStart = cellDate === tempStart;
                const isEnd = cellDate === tempEnd;
                const isInRange = tempStart && tempEnd && cellDate > tempStart && cellDate < tempEnd;
                const isToday = cellDate === todayStr;

                return (
                  <button
                    key={cellDate}
                    type="button"
                    onClick={() => handleDayClick(cellDate)}
                    className={`h-8 w-full rounded-xl text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${
                      isStart || isEnd
                        ? 'bg-indigo-600 text-white shadow-xs font-extrabold z-10'
                        : isInRange
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{day}</span>
                    {/* Today indicator dot */}
                    {isToday && !isStart && !isEnd && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Banner */}
          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Timeline Summary & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {tempStart && tempEnd && tempEnd >= tempStart && (
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Target: {Math.max(1, Math.round((new Date(tempEnd).getTime() - new Date(tempStart).getTime()) / (1000 * 60 * 60 * 24)))} days duration
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTempStart(todayStr);
                  setTempEnd(ProgressCalculationEngine.addDays(todayStr, 30));
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Reset
              </button>
              <button
                id="apply-calendar-dates-button"
                type="button"
                disabled={Boolean(validationError)}
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply Dates</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
