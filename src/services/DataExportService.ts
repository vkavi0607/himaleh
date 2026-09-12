import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Goal, Routine, RoutineLog, DailyReflection, UserSettings, StreakStats } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { ConsistencyEngine } from '../domain/ConsistencyEngine';

export interface HimalehBackupPayload {
  app: 'Himaleh';
  formatVersion: 2;
  exportedAt: string;
  vaultMetadata: {
    totalGoals: number;
    totalRoutines: number;
    totalLogs: number;
    totalReflections: number;
    appName: string;
    appVersion: string;
  };
  goals: Goal[];
  routines: Routine[];
  logs: RoutineLog[];
  reflections: DailyReflection[];
  settings: UserSettings;
}

export interface ImportValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  version?: number;
  exportedAt?: string;
  counts: {
    goals: number;
    routines: number;
    logs: number;
    reflections: number;
  };
  data?: {
    goals: Goal[];
    routines: Routine[];
    logs: RoutineLog[];
    reflections: DailyReflection[];
    settings?: UserSettings;
  };
}

/**
 * Loads the Himaleh Crest SVG into a base64 PNG data URL via off-screen canvas
 */
const getLogoDataUrl = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 160;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, 160, 160);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/himaleh-crest.svg';
    } catch {
      resolve(null);
    }
  });
};

export class DataExportService {
  /**
   * Generates and downloads the raw JSON backup file
   */
  public static exportJsonBackup(
    goals: Goal[],
    routines: Routine[],
    logs: RoutineLog[],
    reflections: DailyReflection[],
    settings: UserSettings
  ): void {
    const payload: HimalehBackupPayload = {
      app: 'Himaleh',
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      vaultMetadata: {
        totalGoals: goals.length,
        totalRoutines: routines.length,
        totalLogs: logs.length,
        totalReflections: reflections.length,
        appName: 'Himaleh',
        appVersion: '1.4.2',
      },
      goals,
      routines,
      logs,
      reflections,
      settings,
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = ProgressCalculationEngine.getTodayStr();
    a.href = url;
    a.download = `himaleh-vault-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates and downloads a real, beautifully formatted PDF report
   */
  public static async exportPdfReport(
    goals: Goal[],
    routines: Routine[],
    logs: RoutineLog[],
    reflections: DailyReflection[],
    settings: UserSettings,
    streakStats?: StreakStats
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const todayStr = ProgressCalculationEngine.getTodayStr();
    const streaks = streakStats || ConsistencyEngine.calculateStreaks(routines, logs, todayStr);
    const exportTimestamp = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Header Banner & Branding
    doc.setFillColor(15, 23, 42); // #0F172A slate-900
    doc.rect(0, 0, pageWidth, 36, 'F');

    // Accent line: Golden Amber
    doc.setFillColor(217, 119, 6); // #D97706
    doc.rect(0, 36, pageWidth, 2, 'F');

    // Try embedding the official logo
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, 5, 26, 26);
      } catch {
        // fallback to vector emblem if addImage fails
        this.drawVectorCrestFallback(doc, margin + 4, 18);
      }
    } else {
      this.drawVectorCrestFallback(doc, margin + 4, 18);
    }

    // Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('HIMALEH', margin + 32, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text('TRACK  •  IMPROVE  •  ACHIEVE', margin + 32, 22);

    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text('Official Personal Goal, Routine & Consistency Report', margin + 32, 28);

    // Top Right Metadata
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`User: ${settings.userName || 'Explorer'}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Exported: ${exportTimestamp}`, pageWidth - margin, 20, { align: 'right' });
    doc.text(`Format: Official Vault Ledger`, pageWidth - margin, 26, { align: 'right' });

    let currentY = 46;

    // 2. Executive Ledger Summary Chips (4 metrics)
    const chipWidth = (contentWidth - 9) / 4;
    const chipHeight = 16;
    const metrics = [
      { label: 'ACTIVE GOALS', value: `${goals.length}` },
      { label: 'ROUTINES', value: `${routines.length}` },
      { label: 'ACTIVE STREAK', value: `${streaks.currentStreak} ${streaks.currentStreak === 1 ? 'Day' : 'Days'}` },
      { label: 'CONSISTENCY', value: `${streaks.weeklyConsistencyPercentage}%` },
    ];

    metrics.forEach((m, idx) => {
      const x = margin + idx * (chipWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, currentY, chipWidth, chipHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label, x + 3.5, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(m.value, x + 3.5, currentY + 12.5);
    });

    currentY += chipHeight + 8;

    // Check if vault is entirely empty
    const isEntirelyEmpty = goals.length === 0 && routines.length === 0 && logs.length === 0 && reflections.length === 0;

    if (isEntirelyEmpty) {
      doc.setFillColor(254, 252, 232); // Amber 50
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text('YOUR HIMALEH JOURNEY STARTS HERE', margin + 8, currentY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(113, 63, 18);
      doc.text(
        'No user goals, routines, completion logs, or reflections have been recorded in this vault yet.',
        margin + 8,
        currentY + 18
      );
      doc.text(
        'Once you begin creating goals and checking off daily routines, this report will populate with your authentic progress history.',
        margin + 8,
        currentY + 24
      );

      currentY += 42;
    }

    // 3. Section: Long-Term Goals
    if (goals.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. LONG-TERM GOALS & TARGETS', margin, currentY);
      currentY += 4;

      const goalsBody = goals.map((g) => {
        const prog = ProgressCalculationEngine.calculateGoalProgress(g, routines, logs);
        const targetStr = `${prog.currentValue} / ${g.targetValue} ${g.unit || ''} (${prog.percentage}%)`;
        return [
          g.title,
          g.category,
          `${g.startDate} to ${g.endDate}`,
          g.status,
          targetStr,
          g.motivation || g.description || '—',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Goal Title', 'Category', 'Timeline', 'Status', 'Progress', 'Motivation / Focus']],
        body: goalsBody,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
      currentY = doc.lastAutoTable.finalY + 9;
    }

    // 4. Section: Daily & Weekly Routines
    if (routines.length > 0) {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. DAILY & RECURRING HABIT ROUTINES', margin, currentY);
      currentY += 4;

      const routinesBody = routines.map((r) => {
        const timeStr = `${String(r.timeHour).padStart(2, '0')}:${String(r.timeMinute).padStart(2, '0')}`;
        const targetStr = r.taskType === 'CHECKBOX' ? 'Standard Checkbox' : `${r.targetValue} ${r.unit || ''}`;
        const linkedGoal = goals.find((g) => g.id === r.linkedGoalId);
        return [
          r.name,
          r.category,
          `${r.frequency} (${r.durationMinutes}m)`,
          timeStr,
          targetStr,
          linkedGoal ? linkedGoal.title : 'General Consistency',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Routine Name', 'Category', 'Frequency', 'Scheduled Time', 'Target Spec', 'Linked Goal']],
        body: routinesBody,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
      currentY = doc.lastAutoTable.finalY + 9;
    }

    // 5. Section: Recent Execution History (Logs)
    if (logs.length > 0) {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. ROUTINE EXECUTION & COMPLETION LOGS', margin, currentY);
      currentY += 4;

      // Sort logs recent first, take up to 60 to prevent excessive PDF bloat
      const sortedLogs = [...logs].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 60);

      const logsBody = sortedLogs.map((l) => {
        const routine = routines.find((r) => r.id === l.routineId);
        const statusText = l.isCompleted ? 'COMPLETED' : l.isSkipped ? 'SKIPPED' : 'PENDING';
        return [
          l.date,
          routine ? routine.name : `Routine #${l.routineId}`,
          statusText,
          l.isCompleted ? `${l.loggedValue || 1}` : l.skipReason || '—',
          l.completedAt ? new Date(l.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Log Date', 'Routine', 'Status', 'Logged Value / Reason', 'Completed At']],
        body: logsBody,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
      currentY = doc.lastAutoTable.finalY + 9;
    }

    // 6. Section: Reflections Journal
    if (reflections.length > 0) {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('4. DAILY REFLECTION JOURNAL ENTRIES', margin, currentY);
      currentY += 4;

      const sortedReflections = [...reflections].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 30);

      const refBody = sortedReflections.map((r) => [
        r.date,
        `${r.rating}/5 Stars`,
        r.wentWell || '—',
        r.couldImprove || '—',
        r.notes || '—',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Rating', 'Daily Wins', 'Areas to Improve', 'Personal Notes']],
        body: refBody,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [51, 65, 85],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
      currentY = doc.lastAutoTable.finalY + 9;
    }

    // Page Numbers & Footer on every page
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Himaleh • Personal Goal, Routine & Consistency System', margin, pageHeight - 6);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }

    // Save and download
    doc.save(`himaleh-progress-report-${todayStr}.pdf`);
  }

  /**
   * Draws a simple vector mountain emblem fallback if image loading is not available
   */
  private static drawVectorCrestFallback(doc: jsPDF, x: number, y: number): void {
    doc.setFillColor(217, 119, 6);
    doc.triangle(x, y - 6, x - 6, y + 4, x + 6, y + 4, 'F');
  }

  /**
   * Validates a JSON backup file content before importing
   */
  public static validateBackupJson(jsonString: string): ImportValidationResult {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return {
          isValid: false,
          error: 'Empty or invalid backup file provided.',
          counts: { goals: 0, routines: 0, logs: 0, reflections: 0 },
        };
      }

      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return {
          isValid: false,
          error: 'Backup file root must be a JSON object.',
          counts: { goals: 0, routines: 0, logs: 0, reflections: 0 },
        };
      }

      // Check format support
      const isHimalehBackup = parsed.app === 'Himaleh' || parsed.goals || parsed.routines;
      if (!isHimalehBackup) {
        return {
          isValid: false,
          error: 'File does not appear to be an authentic Himaleh backup archive.',
          counts: { goals: 0, routines: 0, logs: 0, reflections: 0 },
        };
      }

      const goals: Goal[] = Array.isArray(parsed.goals) ? parsed.goals : [];
      const routines: Routine[] = Array.isArray(parsed.routines) ? parsed.routines : [];
      const logs: RoutineLog[] = Array.isArray(parsed.logs)
        ? parsed.logs
        : Array.isArray(parsed.routineLogs)
        ? parsed.routineLogs
        : [];
      const reflections: DailyReflection[] = Array.isArray(parsed.reflections) ? parsed.reflections : [];
      const settings = parsed.settings || parsed.userSettings || undefined;

      // Validate records structure lightly to catch corrupt files
      const hasCorruptedGoals = goals.some((g) => !g || typeof g.id === 'undefined' || !g.title);
      const hasCorruptedRoutines = routines.some((r) => !r || typeof r.id === 'undefined' || !r.name);

      if (hasCorruptedGoals || hasCorruptedRoutines) {
        return {
          isValid: false,
          error: 'Backup contains corrupted goal or routine records with missing identity keys.',
          counts: {
            goals: goals.length,
            routines: routines.length,
            logs: logs.length,
            reflections: reflections.length,
          },
        };
      }

      return {
        isValid: true,
        version: parsed.formatVersion || 1,
        exportedAt: parsed.exportedAt,
        counts: {
          goals: goals.length,
          routines: routines.length,
          logs: logs.length,
          reflections: reflections.length,
        },
        data: {
          goals,
          routines,
          logs,
          reflections,
          settings,
        },
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        error: `Syntax error reading JSON file: ${err instanceof Error ? err.message : 'Unknown parse failure'}`,
        counts: { goals: 0, routines: 0, logs: 0, reflections: 0 },
      };
    }
  }
}
