import { SoundPreset, UserSettings } from '../types';

let audioCtx: AudioContext | null = null;
let currentCustomAudio: HTMLAudioElement | null = null;
let previewStopCallback: (() => void) | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

function getGainForVolume(volume: 'low' | 'medium' | 'high'): number {
  switch (volume) {
    case 'low':
      return 0.18;
    case 'medium':
      return 0.45;
    case 'high':
      return 0.8;
    default:
      return 0.45;
  }
}

export class SoundService {
  /**
   * Triggers haptic feedback if supported by browser/device
   */
  static triggerHaptic(settings?: UserSettings, pattern: number | number[] = 35): void {
    if (settings && !settings.vibrationEnabled) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Haptics restricted or unavailable
    }
  }

  /**
   * Stops any ongoing preview or sound playback
   */
  static stop(): void {
    if (currentCustomAudio) {
      try {
        currentCustomAudio.pause();
        currentCustomAudio.currentTime = 0;
      } catch {
        // audio already closed
      }
      currentCustomAudio = null;
    }
    if (previewStopCallback) {
      previewStopCallback();
      previewStopCallback = null;
    }
  }

  /**
   * Plays a synthesized chime or custom audio based on settings
   */
  static play(
    type: 'reminder' | 'milestone' | 'celebration' | 'weekly' | 'accountability' | 'tap',
    settings: UserSettings
  ): void {
    if (!settings.soundEnabled) return;

    // Check individual sound category toggles
    if (type === 'reminder' && !settings.reminderSounds) return;
    if ((type === 'celebration' || type === 'weekly' || type === 'milestone') && !settings.celebrationSounds) return;
    if (type === 'accountability' && !settings.accountabilitySounds) return;

    // Trigger subtle haptic alongside sound if enabled
    if (type === 'celebration' || type === 'weekly') {
      this.triggerHaptic(settings, [40, 60, 40]);
    } else if (type === 'accountability') {
      this.triggerHaptic(settings, [50, 80]);
    } else {
      this.triggerHaptic(settings, 30);
    }

    const preset = settings.selectedSound || 'himaleh_chime';

    // Map specific celebration/milestone types if preset is generic
    if (type === 'accountability') {
      this.playPreset('accountability', settings.soundVolume);
      return;
    }
    if (type === 'milestone') {
      this.playPreset('achievement', settings.soundVolume);
      return;
    }
    if (type === 'celebration') {
      this.playPreset('celebration', settings.soundVolume);
      return;
    }
    if (type === 'weekly') {
      this.playPreset('weekly_completion', settings.soundVolume);
      return;
    }

    // Default reminder / notification sound
    if (preset === 'custom' && settings.customSoundData) {
      this.playCustomSound(settings.customSoundData, settings.soundVolume, () => {
        // Fallback to Himaleh Chime if custom sound failed
        this.playPreset('himaleh_chime', settings.soundVolume);
      });
    } else {
      this.playPreset(preset === 'custom' ? 'himaleh_chime' : preset, settings.soundVolume);
    }
  }

  /**
   * Plays a custom audio data URL
   */
  static playCustomSound(
    dataUrl: string,
    volume: 'low' | 'medium' | 'high',
    onError?: (err: Error) => void,
    onEnded?: () => void
  ): HTMLAudioElement | null {
    this.stop();
    try {
      const audio = new Audio(dataUrl);
      audio.volume = getGainForVolume(volume);
      currentCustomAudio = audio;

      audio.onended = () => {
        if (currentCustomAudio === audio) {
          currentCustomAudio = null;
        }
        if (onEnded) onEnded();
      };

      audio.onerror = () => {
        if (currentCustomAudio === audio) {
          currentCustomAudio = null;
        }
        if (onError) onError(new Error('Custom sound playback failed'));
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (onError) onError(err);
        });
      }
      return audio;
    } catch (err) {
      if (onError) onError(err as Error);
      return null;
    }
  }

  /**
   * Plays a specific synthesized sound preset with crystal-clear harmonics
   */
  static playPreset(
    preset: SoundPreset,
    volume: 'low' | 'medium' | 'high' = 'medium',
    onEnded?: () => void
  ): void {
    this.stop();
    const ctx = getAudioContext();
    if (!ctx) {
      if (onEnded) onEnded();
      return;
    }

    const masterGain = ctx.createGain();
    const targetGain = getGainForVolume(volume);
    masterGain.gain.setValueAtTime(targetGain, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (preset) {
      case 'himaleh_chime': {
        // Pentatonic crystalline Himalayan chime: E5 -> G#5 -> B5 -> E6
        const notes = [659.25, 830.61, 987.77, 1318.51];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + index * 0.085;
          const duration = 0.65;

          osc.type = index % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });

        if (onEnded) {
          setTimeout(onEnded, 700);
        }
        break;
      }

      case 'soft_reminder': {
        // Warm dual mallet chime: A4 -> C#5
        const notes = [440, 554.37];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.12;
          const duration = 0.55;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });

        if (onEnded) setTimeout(onEnded, 650);
        break;
      }

      case 'focus_bell': {
        // Tibetan Singing Bowl resonance: fundamental C5 + overtone G5
        const baseFreq = 523.25;
        const overtone = 783.99;
        const duration = 1.4;

        [
          { f: baseFreq, g: 0.4, type: 'sine' as const },
          { f: overtone, g: 0.2, type: 'sine' as const },
          { f: baseFreq * 2.02, g: 0.08, type: 'triangle' as const },
        ].forEach((tone) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = tone.type;
          osc.frequency.setValueAtTime(tone.f, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(tone.g, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + duration);
        });

        if (onEnded) setTimeout(onEnded, 1400);
        break;
      }

      case 'achievement': {
        // Uplifting ascending major chord: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.07;
          const duration = 0.6;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.32, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });

        if (onEnded) setTimeout(onEnded, 750);
        break;
      }

      case 'celebration': {
        // Triumphant fanfare arpeggio: F5 -> A5 -> C6 -> E6
        const notes = [698.46, 880, 1046.5, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.08;
          const duration = 0.8;

          osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });

        if (onEnded) setTimeout(onEnded, 850);
        break;
      }

      case 'weekly_completion': {
        // Rich layered chord harmony: D5 -> F#5 -> A5 -> D6
        const notes = [587.33, 739.99, 880, 1174.66];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.09;
          const duration = 1.0;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });

        if (onEnded) setTimeout(onEnded, 1100);
        break;
      }

      case 'accountability': {
        // Warm, calm descending reminder: E4 -> C#4 (Motivating, never frightening)
        const notes = [329.63, 277.18];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.14;
          const duration = 0.6;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });

        if (onEnded) setTimeout(onEnded, 700);
        break;
      }

      case 'gentle_alert': {
        // Soft bubble tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const duration = 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(940, now + duration);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);

        if (onEnded) setTimeout(onEnded, 200);
        break;
      }

      case 'system_default':
      default: {
        // Crisp standard notification ping (880Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const duration = 0.35;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);

        if (onEnded) setTimeout(onEnded, 380);
        break;
      }
    }
  }
}
