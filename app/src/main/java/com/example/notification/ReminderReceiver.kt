package com.example.notification

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.R
import com.example.data.db.AppDatabase
import com.example.data.model.LogStatus
import com.example.data.model.RoutineLog
import com.example.widget.ConsistencyAppWidgetProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class ReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ReminderScheduler.ACTION_ROUTINE_REMINDER -> {
                val routineId = intent.getLongExtra(ReminderScheduler.EXTRA_ROUTINE_ID, -1L)
                val routineName = intent.getStringExtra(ReminderScheduler.EXTRA_ROUTINE_NAME) ?: "Routine"
                if (routineId != -1L) {
                    showRoutineNotification(context, routineId, routineName)
                }
            }
            ReminderScheduler.ACTION_COMPLETE_ROUTINE -> {
                val routineId = intent.getLongExtra(ReminderScheduler.EXTRA_ROUTINE_ID, -1L)
                if (routineId != -1L) {
                    val pendingResult = goAsync()
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val db = AppDatabase.getInstance(context)
                            val todayStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
                            db.routineLogDao().insertOrUpdateLog(
                                RoutineLog(
                                    routineId = routineId,
                                    date = todayStr,
                                    status = LogStatus.COMPLETED,
                                    actualValue = 1.0,
                                    completedAtTimestamp = System.currentTimeMillis()
                                )
                            )
                            // Dismiss notification
                            val notificationManager =
                                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                            notificationManager.cancel(routineId.toInt())

                            // Update widget
                            ConsistencyAppWidgetProvider.updateAllWidgets(context)
                        } finally {
                            pendingResult.finish()
                        }
                    }
                }
            }
            ReminderScheduler.ACTION_SNOOZE_ROUTINE -> {
                val routineId = intent.getLongExtra(ReminderScheduler.EXTRA_ROUTINE_ID, -1L)
                val routineName = intent.getStringExtra(ReminderScheduler.EXTRA_ROUTINE_NAME) ?: "Routine"
                if (routineId != -1L) {
                    ReminderScheduler.snoozeReminder(context, routineId, routineName)
                    val notificationManager =
                        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    notificationManager.cancel(routineId.toInt())
                }
            }
            Intent.ACTION_BOOT_COMPLETED -> {
                val pendingResult = goAsync()
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val db = AppDatabase.getInstance(context)
                        val routines = db.routineDao().getAllRoutines()
                        for (routine in routines) {
                            if (routine.reminderEnabled && !routine.isPaused) {
                                ReminderScheduler.scheduleRoutineReminder(context, routine)
                            }
                        }
                    } finally {
                        pendingResult.finish()
                    }
                }
            }
        }
    }

    private fun showRoutineNotification(context: Context, routineId: Long, routineName: String) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Content intent: open app
        val contentIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            routineId.toInt(),
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Complete
        val completeIntent = Intent(context, ReminderReceiver::class.java).apply {
            action = ReminderScheduler.ACTION_COMPLETE_ROUTINE
            putExtra(ReminderScheduler.EXTRA_ROUTINE_ID, routineId)
        }
        val completePendingIntent = PendingIntent.getBroadcast(
            context,
            (routineId + 200000).toInt(),
            completeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Snooze
        val snoozeIntent = Intent(context, ReminderReceiver::class.java).apply {
            action = ReminderScheduler.ACTION_SNOOZE_ROUTINE
            putExtra(ReminderScheduler.EXTRA_ROUTINE_ID, routineId)
            putExtra(ReminderScheduler.EXTRA_ROUTINE_NAME, routineName)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            (routineId + 300000).toInt(),
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, ReminderScheduler.CHANNEL_ROUTINES_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Himaleh: $routineName")
            .setContentText("Stay consistent! Mark complete or snooze for 15 minutes.")
            .setSubText("Himaleh")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(android.R.drawable.checkbox_on_background, "Complete", completePendingIntent)
            .addAction(android.R.drawable.ic_popup_sync, "Snooze 15m", snoozePendingIntent)
            .build()

        notificationManager.notify(routineId.toInt(), notification)
    }
}
