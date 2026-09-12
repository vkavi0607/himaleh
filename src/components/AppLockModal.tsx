import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { SoundService } from '../services/SoundService';
import { UserSettings } from '../types';

interface AppLockModalProps {
  correctPin: string;
  settings: UserSettings;
  onUnlock: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  correctPin,
  settings,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    SoundService.triggerHaptic(settings, 20);

    if (newPin.length === 4) {
      if (newPin === correctPin) {
        SoundService.play('tap', settings);
        onUnlock();
      } else {
        setError(true);
        SoundService.triggerHaptic(settings, [60, 80]);
        setTimeout(() => {
          setPin('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(false);
      SoundService.triggerHaptic(settings, 15);
    }
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-neutral-950 text-neutral-50"
    >
      <div className="max-w-xs w-full flex flex-col items-center space-y-6 text-center">
        {/* Summit Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
          <Lock className="h-8 w-8 text-indigo-400" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight font-display">
            Himaleh Security
          </h2>
          <p className="text-xs text-neutral-400">
            Enter your 4-digit PIN to access your ledger
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  error
                    ? 'border-rose-500 bg-rose-500/40'
                    : isFilled
                    ? 'border-indigo-500 bg-indigo-500 scale-110'
                    : 'border-neutral-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 animate-bounce">
            <AlertCircle className="h-4 w-4" />
            <span>Incorrect PIN. Please try again.</span>
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3.5 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-neutral-900 border border-neutral-800/80 text-xl font-bold font-mono hover:bg-neutral-800 active:scale-95 transition cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-neutral-900 border border-neutral-800/80 text-xl font-bold font-mono hover:bg-neutral-800 active:scale-95 transition cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-neutral-900 border border-neutral-800/80 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 active:scale-95 transition cursor-pointer flex items-center justify-center"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
