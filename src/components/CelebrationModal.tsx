import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CelebrationEvent } from '../types';
import { Trophy, Award, Target, Flame, Sparkles } from 'lucide-react';

interface CelebrationModalProps {
  event: CelebrationEvent | null;
  onDismiss: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ event, onDismiss }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!event || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const colors = [
      '#ec4899', '#8b5cf6', '#3b82f6', '#10b981',
      '#f59e0b', '#eab308', '#06b6d4', '#d946ef'
    ];

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotSpeed: number;
    }> = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [event]);

  if (!event) return null;

  return (
    <AnimatePresence>
      <div
        id="celebration-dialog"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti Background Canvas */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          />

          <div className="relative z-10 flex flex-col items-center gap-4 py-2">
            {/* Header Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shadow-inner">
              {event.type === 'DAILY_COMPLETE' && <Trophy className="h-10 w-10 animate-bounce" />}
              {event.type === 'WEEKLY_COMPLETE' && <Award className="h-10 w-10 animate-bounce" />}
              {event.type === 'GOAL_COMPLETE' && <Target className="h-10 w-10 animate-bounce" />}
            </div>

            {/* Event Specific Content */}
            {event.type === 'DAILY_COMPLETE' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    Day Complete!
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    100% of today's planned routines completed.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 px-4 py-2 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-semibold">
                    {event.currentStreak > 1
                      ? `${event.currentStreak} Day Streak! Keep the momentum!`
                      : 'Streak Started! Great effort!'}
                  </span>
                </div>
              </>
            )}

            {event.type === 'WEEKLY_COMPLETE' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    Weekly Consistency Achieved!
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Target days reached with {event.consistencyPct}% consistency rate.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-semibold">
                    {event.completedDays} / {event.targetDays} days mastered
                  </span>
                </div>
              </>
            )}

            {event.type === 'GOAL_COMPLETE' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                    Goal Completed!
                  </h2>
                  <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                    {event.goalTitle}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Target achieved: {event.targetValue} {event.unit}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/50 px-4 py-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                  100% Target Met
                </div>
              </>
            )}

            <button
              id="dismiss-celebration-button"
              type="button"
              onClick={onDismiss}
              className="mt-2 w-full rounded-xl bg-neutral-900 dark:bg-neutral-100 py-3 text-sm font-bold text-white dark:text-neutral-900 shadow-md transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
            >
              Awesome!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
