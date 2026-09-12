import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

interface SystemStatusBarProps {
  isDarkMode: boolean;
  timeFormat?: '12h' | '24h';
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({ isDarkMode, timeFormat = '12h' }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(96);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (timeFormat === '24h') {
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        setTimeStr(`${h}:${m}`);
      } else {
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        h = h % 12 || 12;
        setTimeStr(`${h}:${m}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [timeFormat]);

  // Attempt to read battery API if available
  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        (navigator as unknown as { getBattery: () => Promise<{ level: number }> }).getBattery().then((battery) => {
          if (battery && typeof battery.level === 'number') {
            setBatteryLevel(Math.round(battery.level * 100));
          }
        }).catch(() => {});
      }
    } catch {
      // not supported
    }
  }, []);

  return (
    <div
      id="system-status-bar"
      className={`w-full z-50 select-none px-4 py-1.5 flex items-center justify-between text-xs font-semibold tracking-tight transition-colors duration-200 border-b md:hidden ${
        isDarkMode
          ? 'bg-neutral-950 text-neutral-100 border-neutral-800/80'
          : 'bg-neutral-100 text-neutral-900 border-neutral-200/80'
      }`}
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 6px)' }}
    >
      {/* Left: Clock */}
      <div className="flex items-center gap-1.5 font-bold tracking-tight">
        <span id="status-bar-time" className="text-[12px] font-mono font-extrabold">{timeStr || '9:41'}</span>
      </div>

      {/* Center: Himaleh Summit mark */}
      <div className="flex items-center gap-1 opacity-75">
        <span className="text-[11px] font-bold tracking-wider font-display uppercase">HIMALEH</span>
      </div>

      {/* Right: Cellular Signal, Wifi, Battery */}
      <div className="flex items-center gap-2">
        {/* Cellular 4 bars */}
        <div className="flex items-end gap-0.5 h-3" title="Cellular Signal">
          <div className="w-0.5 h-1.5 rounded-full bg-current opacity-90" />
          <div className="w-0.5 h-2 rounded-full bg-current opacity-90" />
          <div className="w-0.5 h-2.5 rounded-full bg-current opacity-90" />
          <div className="w-0.5 h-3 rounded-full bg-current opacity-90" />
        </div>

        {/* 5G Label */}
        <span className="text-[10px] font-extrabold font-mono tracking-tighter">5G</span>

        {/* Wifi Icon */}
        <Wifi className="h-3.5 w-3.5 opacity-90" />

        {/* Battery Container */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono font-bold">{batteryLevel}%</span>
          <div className="relative flex items-center">
            <Battery className="h-4 w-4 opacity-90" />
            <div
              className={`absolute left-[2.5px] top-[4.5px] h-[5px] rounded-[1px] ${
                batteryLevel <= 20 ? 'bg-rose-500' : isDarkMode ? 'bg-emerald-400' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.max(2, Math.min(8, (batteryLevel / 100) * 8))}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
