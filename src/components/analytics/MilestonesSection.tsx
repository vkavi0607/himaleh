import React, { useEffect, useRef } from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { MilestoneItem } from '../../domain/AnalyticsCalculationEngine';
import { StorageService } from '../../data/storage';
import { SoundService } from '../../services/SoundService';
import { CelebrationEvent, UserSettings } from '../../types';

interface MilestonesSectionProps {
  milestones: MilestoneItem[];
  settings?: UserSettings;
  onTriggerCelebration?: (event: CelebrationEvent) => void;
  reduceMotion?: boolean;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  milestones,
  settings,
  onTriggerCelebration,
  reduceMotion = false,
}) => {
  const isInitialMount = useRef(true);

  // Check for newly unlocked milestones
  useEffect(() => {
    // Only check if user has actual data
    milestones.forEach((m) => {
      if (m.isUnlocked) {
        const isNew = StorageService.markMilestoneUnlocked(m.id);
        // If not initial load and milestone was newly reached:
        if (isNew && !isInitialMount.current) {
          if (settings) {
            SoundService.play('milestone', settings);
          }
          if (onTriggerCelebration) {
            onTriggerCelebration({
              type: 'MILESTONE_UNLOCKED',
              milestoneTitle: m.title,
              description: m.description,
              badge: m.badge,
            });
          }
        }
      }
    });

    isInitialMount.current = false;
  }, [milestones, settings, onTriggerCelebration]);

  const unlockedCount = milestones.filter((m) => m.isUnlocked).length;

  return (
    <div
      id="milestones-section"
      className="rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Alpinist Milestones
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Permanent badges earned along your personal ascent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold">
          <span>{unlockedCount} / {milestones.length} Unlocked</span>
        </div>
      </div>

      {/* Grid of Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {milestones.map((m) => {
          const isUnlocked = m.isUnlocked;

          return (
            <div
              key={m.id}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all ${
                reduceMotion ? '' : 'hover:scale-[1.02] active:scale-[0.98]'
              } ${
                isUnlocked
                  ? 'bg-gradient-to-b from-amber-50/70 to-white dark:from-neutral-800 dark:to-neutral-900 border-amber-300/80 dark:border-amber-700/60 shadow-2xs'
                  : 'bg-neutral-50/60 dark:bg-neutral-800/30 border-neutral-200/60 dark:border-neutral-800 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl shadow-2xs ${
                      isUnlocked
                        ? 'bg-amber-100 dark:bg-amber-950/80 border border-amber-300/80'
                        : 'bg-neutral-200/60 dark:bg-neutral-700/40 text-neutral-400'
                    }`}
                  >
                    {isUnlocked ? m.badge : <Lock className="h-4 w-4 text-neutral-400" />}
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-neutral-900 dark:text-neutral-100 font-display line-clamp-1">
                      {m.title}
                    </h3>
                    <span className="text-[10px] font-semibold text-neutral-500">
                      {isUnlocked ? 'Unlocked' : `${m.current} / ${m.target}`}
                    </span>
                  </div>
                </div>

                {isUnlocked && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </div>

              <p className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {m.description}
              </p>

              {/* Progress Bar for Locked Milestones */}
              {!isUnlocked && (
                <div className="mt-3 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                      style={{ width: `${m.progressPct}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-end text-[9px] font-bold text-neutral-400">
                    {m.progressPct}%
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
