package com.example.notification

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.example.data.model.Routine
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId

object ReminderScheduler {
    const val CHANNEL_ROUTINES_ID = "routine_reminders_channel"
    const val CHANNEL_SUMMARY_ID = "daily_summary_channel"

    const val ACTION_ROUTINE_REMINDER = "com.example.ACTION_ROUTINE_REMINDER"
    const val ACTION_COMPLETE_ROUTINE = "com.example.ACTION_COMPLETE_ROUTINE"
    const val ACTION_SNOOZE_ROUTINE = "com.example.ACTION_SNOOZE_ROUTINE"

    const val EXTRA_ROUTINE_ID = "extra_routine_id"
    const val EXTRA_ROUTINE_NAME = "extra_routine_name"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val routineChannel = NotificationChannel(
                CHANNEL_ROUTINES_ID,
                "Routine Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reminders for scheduled daily habits and routines"
                enableVibration(true)
            }

            val summaryChannel = NotificationChannel(
                CHANNEL_SUMMARY_ID,
                "Daily Summary & Reflection",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Evening accountability summary and reflection"
            }

            notificationManager.createNotificationChannel(routineChannel)
            notificationManager.createNotificationChannel(summaryChannel)
        }
    }

    fun scheduleRoutineReminder(context: Context, routine: Routine) {
        if (!routine.reminderEnabled || routine.isPaused) {
            cancelRoutineReminder(context, routine.id)
            return
        }

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        // Calculate next trigger time accounting for recurrence and scheduled days
        val now = LocalDateTime.now()
        val routineHour = routine.timeHour.coerceIn(0, 23)
        val routineMinute = routine.timeMinute.coerceIn(0, 59)

        // Parse scheduled days (1=Monday ... 7=Sunday)
        val scheduledDays = when (routine.frequency) {
            com.example.data.model.RoutineFrequency.DAILY -> setOf(1, 2, 3, 4, 5, 6, 7)
            com.example.data.model.RoutineFrequency.WEEKDAYS -> setOf(1, 2, 3, 4, 5)
            else -> {
                routine.frequencyDays.split(",")
                    .mapNotNull { it.trim().toIntOrNull() }
                    .toSet()
                    .ifEmpty { setOf(1, 2, 3, 4, 5, 6, 7) }
            }
        }

        var candidateDate = LocalDate.now()
        var targetTime: LocalDateTime? = null

        for (dayOffset in 0..14) {
            val checkDate = candidateDate.plusDays(dayOffset.toLong())
            val dayOfWeekIso = checkDate.dayOfWeek.value // 1=Mon ... 7=Sun
            if (scheduledDays.contains(dayOfWeekIso)) {
                val checkTime = LocalDateTime.of(checkDate, LocalTime.of(routineHour, routineMinute))
                if (checkTime.isAfter(now)) {
                    targetTime = checkTime
                    break
                }
            }
        }

        if (targetTime == null) {
            // Fallback to tomorrow at scheduled time
            targetTime = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(routineHour, routineMinute))
        }

        val triggerMillis = targetTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()

        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_ROUTINE_REMINDER
            putExtra(EXTRA_ROUTINE_ID, routine.id)
            putExtra(EXTRA_ROUTINE_NAME, routine.name)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            routine.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerMillis,
                    pendingIntent
                )
            }
        } catch (e: SecurityException) {
            // Inexact fallback if exact alarm permission is restricted
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                triggerMillis,
                pendingIntent
            )
        }
    }

    fun cancelRoutineReminder(context: Context, routineId: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_ROUTINE_REMINDER
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            routineId.toInt(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    fun snoozeReminder(context: Context, routineId: Long, routineName: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val triggerMillis = System.currentTimeMillis() + (15 * 60 * 1000) // 15 minutes

        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_ROUTINE_REMINDER
            putExtra(EXTRA_ROUTINE_ID, routineId)
            putExtra(EXTRA_ROUTINE_NAME, routineName)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            (routineId + 100000).toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.set(
            AlarmManager.RTC_WAKEUP,
            triggerMillis,
            pendingIntent
        )
    }
}
