/**
 * HIMALEH SYSTEM TIME & AUTOMATIC THEME ENGINE
 * 
 * Accurately resolves Light vs Dark mode based on:
 * - Real local system time (Date.prototype.getHours(), getMinutes(), getSeconds())
 * - Configured light / dark schedule times (e.g., "06:00" -> Light, "18:00" -> Dark)
 * - Arbitrary user schedules (e.g. 07:30 Light, 21:00 Dark, or inverted like 20:00 Light, 06:00 Dark)
 * - Midnight rollovers (00:00, 23:59)
 * - Timezone changes and daylight-saving time shifts
 * - Next theme change prediction ("Next theme change: Dark at 6:00 PM" / "Light at 6:00 AM")
 */

export interface TimeSchedule {
  lightTime: string; // "HH:mm"
  darkTime: string;  // "HH:mm"
}

export interface NextThemeChangeInfo {
  nextTheme: 'light' | 'dark';
  timeStr: string;        // 24h format e.g. "18:00"
  formattedTime: string;  // user-friendly format e.g. "6:00 PM"
  isTomorrow: boolean;
  minutesRemaining: number;
}

/**
 * Parses "HH:mm" into total minutes from midnight (0 - 1439).
 * Returns fallback if invalid.
 */
export function parseTimeToMinutes(timeStr?: string, fallback = 0): number {
  if (!timeStr || typeof timeStr !== 'string') return fallback;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return fallback;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return fallback;
  return Math.min(Math.max(hours * 60 + minutes, 0), 1439);
}

/**
 * Formats "HH:mm" string or hours/minutes into locale 12h/24h string.
 * e.g. "18:00" -> "6:00 PM", "06:00" -> "6:00 AM"
 */
export function formatTimeDisplay(timeStr: string, use24h = false): string {
  const totalMins = parseTimeToMinutes(timeStr, 360);
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const mm = minutes.toString().padStart(2, '0');

  if (use24h) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${mm} ${period}`;
}

/**
 * Calculates whether the given local date/time should be in Dark mode according to schedule.
 * 
 * Standard Schedule (light < dark, e.g. Light at 06:00, Dark at 18:00):
 * - [00:00 to 05:59] -> Dark
 * - [06:00 to 17:59] -> Light
 * - [18:00 to 23:59] -> Dark
 * 
 * Inverted Schedule (dark < light, e.g. Dark at 08:00, Light at 20:00):
 * - [00:00 to 07:59] -> Light
 * - [08:00 to 19:59] -> Dark
 * - [20:00 to 23:59] -> Light
 */
export function isDarkBySchedule(
  currentDate: Date = new Date(),
  lightTime = '06:00',
  darkTime = '18:00'
): boolean {
  const curMins = currentDate.getHours() * 60 + currentDate.getMinutes();
  const lightMins = parseTimeToMinutes(lightTime, 6 * 60);
  const darkMins = parseTimeToMinutes(darkTime, 18 * 60);

  // If light and dark times are equal, default to false (light)
  if (lightMins === darkMins) {
    return false;
  }

  if (lightMins < darkMins) {
    // Normal daytime light: Light starts at lightMins, Dark starts at darkMins
    return curMins < lightMins || curMins >= darkMins;
  } else {
    // Night owl / inverted schedule: Dark starts in morning, Light starts in evening
    return curMins >= darkMins && curMins < lightMins;
  }
}

/**
 * Computes the next theme transition based on the real local time.
 * E.g., "Next theme change: Dark at 6:00 PM"
 */
export function getNextThemeChange(
  currentDate: Date = new Date(),
  lightTime = '06:00',
  darkTime = '18:00',
  use24h = false
): NextThemeChangeInfo {
  const curMins = currentDate.getHours() * 60 + currentDate.getMinutes();
  const isCurrentlyDark = isDarkBySchedule(currentDate, lightTime, darkTime);
  const targetNextTheme: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';
  const targetTimeStr = targetNextTheme === 'light' ? lightTime : darkTime;
  const targetMins = parseTimeToMinutes(targetTimeStr);

  let minutesRemaining: number;
  let isTomorrow = false;

  if (targetMins > curMins) {
    minutesRemaining = targetMins - curMins;
  } else {
    // Wraps past midnight to tomorrow
    minutesRemaining = 1440 - curMins + targetMins;
    isTomorrow = true;
  }

  return {
    nextTheme: targetNextTheme,
    timeStr: targetTimeStr,
    formattedTime: formatTimeDisplay(targetTimeStr, use24h),
    isTomorrow,
    minutesRemaining,
  };
}
