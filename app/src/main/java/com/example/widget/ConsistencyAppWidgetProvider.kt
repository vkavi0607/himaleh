package com.example.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.example.MainActivity
import com.example.R
import com.example.data.db.AppDatabase
import com.example.data.model.LogStatus
import com.example.domain.ConsistencyEngine
import com.example.domain.ProgressCalculationEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate

class ConsistencyAppWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        updateWidgetAsync(context, appWidgetManager, appWidgetIds)
    }

    private fun updateWidgetAsync(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            val db = AppDatabase.getInstance(context)
            val today = LocalDate.now()
            val todayStr = today.format(ProgressCalculationEngine.DATE_FORMATTER)

            val routines = db.routineDao().getAllRoutines()
            val logsForToday = db.routineLogDao().getLogsForDate(todayStr)
            val allLogs = db.routineLogDao().getAllLogs()

            val dailyProgress = ProgressCalculationEngine.calculateDailyProgress(
                routines = routines,
                logsForDate = logsForToday,
                allLogs = allLogs,
                date = today
            )

            val streakStats = ConsistencyEngine.calculateStreaks(
                routines = routines,
                allLogs = allLogs,
                today = today
            )

            val pct = dailyProgress.completionPercentage?.toInt() ?: 0
            val streak = streakStats.currentStreak

            val previewLines = StringBuilder()
            if (dailyProgress.plannedRoutines.isEmpty()) {
                previewLines.append("No routines scheduled today")
            } else {
                for (routine in dailyProgress.plannedRoutines.take(4)) {
                    val isDone = dailyProgress.completedRoutineIds.contains(routine.id)
                    val isSkipped = dailyProgress.skippedRoutineIds.contains(routine.id)
                    val prefix = when {
                        isDone -> "☑ "
                        isSkipped -> "↷ "
                        else -> "☐ "
                    }
                    val timeFormatted = String.format("%02d:%02d", routine.timeHour, routine.timeMinute)
                    previewLines.append("$prefix${routine.name} ($timeFormatted)\n")
                }
                if (dailyProgress.plannedRoutines.size > 4) {
                    previewLines.append("+${dailyProgress.plannedRoutines.size - 4} more...")
                }
            }

            for (widgetId in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_consistency)

                views.setTextViewText(R.id.widget_app_title, "Himaleh")
                views.setTextViewText(R.id.widget_streak_text, "🔥 ${streak}d")
                views.setTextViewText(
                    R.id.widget_progress_text,
                    if (dailyProgress.totalPlanned == 0) "Rest Day" else "Today: $pct%"
                )
                views.setTextViewText(
                    R.id.widget_counter_text,
                    "${dailyProgress.completedCount}/${dailyProgress.totalPlanned}"
                )
                views.setProgressBar(R.id.widget_progress_bar, 100, pct, false)
                views.setTextViewText(R.id.widget_routines_preview, previewLines.toString().trim())

                // Open main activity when widget is clicked
                val openIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    widgetId,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

                appWidgetManager.updateAppWidget(widgetId, views)
            }
        }
    }

    companion object {
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(
                ComponentName(context, ConsistencyAppWidgetProvider::class.java)
            )
            if (ids.isNotEmpty()) {
                val intent = Intent(context, ConsistencyAppWidgetProvider::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                }
                context.sendBroadcast(intent)
            }
        }
    }
}
