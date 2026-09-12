import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CelebrationEvent } from '../types';
import { Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { HimalehLogo } from './HimalehLogo';

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

    const width = (canvas.width = canvas.parentElement?.clientWidth || 420);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    // Official Himaleh brand celebration colors: Gold, Amber, Snow White, Crimson Flag
    const brandColors = [
      '#F59E0B', // Golden Trail
      '#D97706', // Summit Amber
      '#FBBF24', // Warm Gold
      '#FEF3C7', // Starlight Gold
      '#DC2626', // Crimson Summit Flag
      '#FFFFFF', // Alpine Snow
    ];

    // Summit Embers rising and shimmering
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      rotSpeed: number;
    }> = [];

    for (let i = 0; i < 65; i++) {
      particles.push({
        x: Math.random() * width,
        y: height + Math.random() * 40,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -(1.5 + Math.random() * 3.5), // Ascending like summit embers
        size: 3 + Math.random() * 5,
        color: brandColors[Math.floor(Math.random() * brandColors.length)],
        alpha: 0.7 + Math.random() * 0.3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 5,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        // Reset when drifted out of top
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;

        // Draw diamond ember or star particle
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.7, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-200/60 dark:border-amber-900/40 p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Golden Summit Backlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-400/15 dark:bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Ascending Embers Background Canvas */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          />

          <div className="relative z-10 flex flex-col items-center gap-4 py-2">
            {/* Signature Himaleh Official Mountain Crest */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-3 rounded-full bg-amber-400/20 dark:bg-amber-500/20 blur-xl animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-b from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/60 shadow-lg">
                <HimalehLogo variant="crest" size={68} animated={true} />
              </div>
            </div>

            {/* Event Specific Content */}
            {event.type === 'DAILY_COMPLETE' && (
              <>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                    Himaleh • Daily Summit
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 font-serif">
                    Peak Scaled for Today!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                    100% of today's planned routines completed along your consistency trail.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/50 px-4 py-2 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                  <Flame className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-bold">
                    {event.currentStreak > 1
                      ? `${event.currentStreak} Day Peak Streak! Keep ascending!`
                      : 'Summit Streak Started! High momentum!'}
                  </span>
                </div>
              </>
            )}

            {event.type === 'WEEKLY_COMPLETE' && (
              <>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                    Himaleh • Weekly Mastery
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 font-serif">
                    Weekly Summit Conquered!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
                    Target days reached with a rigorous {event.consistencyPct}% consistency rate.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 px-4 py-2 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-bold">
                    {event.completedDays} / {event.targetDays} Days Mastered
                  </span>
                </div>
              </>
            )}

            {event.type === 'GOAL_COMPLETE' && (
              <>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Flag Planted At The Summit
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 font-serif">
                    Goal Milestone Achieved!
                  </h2>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                    {event.goalTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Final target reached: {event.targetValue} {event.unit}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-red-500/15 to-amber-500/15 px-4 py-2 text-slate-900 dark:text-slate-100 border border-amber-300 dark:border-amber-700/60 font-bold text-xs shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>100% Target Met • Permanent Milestone Recorded</span>
                </div>
              </>
            )}

            <button
              id="dismiss-celebration-button"
              type="button"
              onClick={onDismiss}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-white dark:to-slate-100 py-3.5 text-sm font-bold text-white dark:text-slate-900 shadow-md transition hover:opacity-95 active:scale-[0.99] cursor-pointer"
            >
              Continue the Ascent
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
