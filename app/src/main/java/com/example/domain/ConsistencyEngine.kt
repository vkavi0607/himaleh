package com.example.domain

import com.example.data.model.*
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

data class StreakStats(
    val currentStreak: Int,
    val longestStreak: Int,
    val routineStreaks: Map<Long, Int> = emptyMap(),
    val totalCompletedDays: Int = 0,
    val weeklyConsistency: Double = 0.0,
    val monthlyConsistency: Double = 0.0,
    val overallConsistency: Double = 0.0,
    val weeklyCompletedDays: Int = 0,
    val weeklyTargetDays: Int = 5
)

data class MissedInsight(
    val routineId: Long,
    val routineName: String,
    val dayOfWeek: DayOfWeek,
    val missCount: Int,
    val message: String
)

object ConsistencyEngine {

    /**
     * Calculates streak stats across all historical data up to [today].
     */
    fun calculateStreaks(
        routines: List<Routine>,
        allLogs: List<RoutineLog>,
        today: LocalDate
    ): StreakStats {
        if (routines.isEmpty()) {
            return StreakStats(currentStreak = 0, longestStreak = 0)
        }

        // Group logs by date string
        val logsByDate = allLogs.groupBy { it.date }

        // Find the earliest start date among routines or logs
        val earliestLogDate = allLogs.mapNotNull {
            try { LocalDate.parse(it.date, ProgressCalculationEngine.DATE_FORMATTER) } catch (e: Exception) { null }
        }.minOrNull()

        val earliestRoutineDate = routines.mapNotNull {
            try { LocalDate.parse(it.startDate, ProgressCalculationEngine.DATE_FORMATTER) } catch (e: Exception) { null }
        }.minOrNull()

        val startDate = when {
            earliestLogDate != null && earliestRoutineDate != null -> if (earliestLogDate.isBefore(earliestRoutineDate)) earliestLogDate else earliestRoutineDate
            earliestLogDate != null -> earliestLogDate
            earliestRoutineDate != null -> earliestRoutineDate
            else -> today
        }

        // Evaluate each day from startDate up to today
        var currentStreak = 0
        var maxStreak = 0
        var rollingStreak = 0
        var totalCompletedDays = 0

        var past7DaysPlanned = 0
        var past7DaysCompleted = 0
        var past30DaysPlanned = 0
        var past30DaysCompleted = 0
        var allTimePlanned = 0
        var allTimeCompleted = 0

        val daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, today).toInt().coerceAtLeast(0)
        // We evaluate day by day chronologically to find historical longest streak
        for (i in 0..daysBetween) {
            val evalDate = startDate.plusDays(i.toLong())
            val dateStr = evalDate.format(ProgressCalculationEngine.DATE_FORMATTER)
            val logs = logsByDate[dateStr] ?: emptyList()

            val dailyProgress = ProgressCalculationEngine.calculateDailyProgress(
                routines = routines,
                logsForDate = logs,
                allLogs = allLogs,
                date = evalDate
            )

            val isToday = evalDate == today

            if (dailyProgress.totalPlanned > 0) {
                val nonSkipped = dailyProgress.totalPlanned - dailyProgress.skippedCount
                if (nonSkipped > 0) {
                    allTimePlanned += nonSkipped
                    allTimeCompleted += dailyProgress.completedCount

                    val daysAgo = java.time.temporal.ChronoUnit.DAYS.between(evalDate, today).toInt()
                    if (daysAgo in 0..6) {
                        past7DaysPlanned += nonSkipped
                        past7DaysCompleted += dailyProgress.completedCount
                    }
                    if (daysAgo in 0..29) {
                        past30DaysPlanned += nonSkipped
                        past30DaysCompleted += dailyProgress.completedCount
                    }
                }
            }

            // Determine if evalDate counts as completed
            if (dailyProgress.totalPlanned == 0 || dailyProgress.skippedCount == dailyProgress.totalPlanned) {
                // Rest day or fully skipped day -> neutral, does NOT break the streak!
                // rollingStreak stays unchanged
            } else {
                val activePlanned = dailyProgress.totalPlanned - dailyProgress.skippedCount
                if (dailyProgress.completedCount >= activePlanned) {
                    // Successful day!
                    rollingStreak++
                    totalCompletedDays++
                    if (rollingStreak > maxStreak) {
                        maxStreak = rollingStreak
                    }
                } else {
                    // Not all completed
                    if (isToday) {
                        // For today, it's still ongoing, so don't increment rollingStreak,
                        // but don't reset to 0 yet either.
                    } else {
                        // Past day missed -> streak broken!
                        rollingStreak = 0
                    }
                }
            }
        }

        // Current streak is the active rolling streak
        currentStreak = rollingStreak
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak
        }

        // Calculate routine-specific streaks
        val routineStreaks = mutableMapOf<Long, Int>()
        for (routine in routines) {
            routineStreaks[routine.id] = calculateRoutineStreak(routine, allLogs, today)
        }

        val weeklyConsistency = if (past7DaysPlanned > 0) {
            (Math.round((past7DaysCompleted.toDouble() / past7DaysPlanned.toDouble()) * 1000.0) / 10.0).coerceIn(0.0, 100.0)
        } else 100.0

        val monthlyConsistency = if (past30DaysPlanned > 0) {
            (Math.round((past30DaysCompleted.toDouble() / past30DaysPlanned.toDouble()) * 1000.0) / 10.0).coerceIn(0.0, 100.0)
        } else 100.0

        val overallConsistency = if (allTimePlanned > 0) {
            (Math.round((allTimeCompleted.toDouble() / allTimePlanned.toDouble()) * 1000.0) / 10.0).coerceIn(0.0, 100.0)
        } else 100.0

        // Calculate completed days in the current calendar week (Monday to Sunday)
        val startOfWeek = today.with(DayOfWeek.MONDAY)
        var weeklyCompletedDays = 0
        for (dayOffset in 0..6) {
            val evalDate = startOfWeek.plusDays(dayOffset.toLong())
            if (!evalDate.isAfter(today)) {
                val dateStr = evalDate.format(ProgressCalculationEngine.DATE_FORMATTER)
                val logs = logsByDate[dateStr] ?: emptyList()
                val dp = ProgressCalculationEngine.calculateDailyProgress(routines, logs, allLogs, evalDate)
                if (dp.totalPlanned > 0) {
                    val activePlanned = dp.totalPlanned - dp.skippedCount
                    if (activePlanned > 0 && dp.completedCount >= activePlanned) {
                        weeklyCompletedDays++
                    }
                }
            }
        }

        return StreakStats(
            currentStreak = currentStreak,
            longestStreak = maxStreak,
            routineStreaks = routineStreaks,
            totalCompletedDays = totalCompletedDays,
            weeklyConsistency = weeklyConsistency,
            monthlyConsistency = monthlyConsistency,
            overallConsistency = overallConsistency,
            weeklyCompletedDays = weeklyCompletedDays,
            weeklyTargetDays = 5
        )
    }

    private fun calculateRoutineStreak(
        routine: Routine,
        allLogs: List<RoutineLog>,
        today: LocalDate
    ): Int {
        val routineLogs = allLogs.filter { it.routineId == routine.id }
        val logsByDate = routineLogs.associateBy { it.date }

        var streak = 0
        var checkDate = today

        // Check up to 180 days back
        for (i in 0..180) {
            val dateStr = checkDate.format(ProgressCalculationEngine.DATE_FORMATTER)
            val isScheduled = ProgressCalculationEngine.isRoutineScheduledForDate(routine, checkDate, routineLogs)

            if (isScheduled) {
                val log = logsByDate[dateStr]
                if (log?.status == LogStatus.COMPLETED) {
                    streak++
                } else if (log?.status == LogStatus.SKIPPED) {
                    // Neutral skip
                } else {
                    if (checkDate == today) {
                        // Today not completed yet, check yesterday
                    } else {
                        break // Missed
                    }
                }
            }
            checkDate = checkDate.minusDays(1)
        }
        return streak
    }

    /**
     * Generates pattern insights from historical missed routines.
     * Only returns insights when there is sufficient data (>= 2 misses on a given day of week).
     */
    fun generateMissedInsights(
        routines: List<Routine>,
        allLogs: List<RoutineLog>,
        today: LocalDate
    ): List<MissedInsight> {
        val insights = mutableListOf<MissedInsight>()
        val logsByRoutine = allLogs.groupBy { it.routineId }

        for (routine in routines) {
            val logs = logsByRoutine[routine.id] ?: emptyList()
            val logsByDate = logs.associateBy { it.date }

            // Count scheduled vs missed for each day of week over past 8 weeks
            val missedByDayOfWeek = mutableMapOf<DayOfWeek, Int>()
            val scheduledByDayOfWeek = mutableMapOf<DayOfWeek, Int>()

            for (i in 1..56) { // past 8 weeks
                val checkDate = today.minusDays(i.toLong())
                val isScheduled = ProgressCalculationEngine.isRoutineScheduledForDate(routine, checkDate, logs)
                if (isScheduled) {
                    val dow = checkDate.dayOfWeek
                    scheduledByDayOfWeek[dow] = (scheduledByDayOfWeek[dow] ?: 0) + 1

                    val log = logsByDate[checkDate.format(ProgressCalculationEngine.DATE_FORMATTER)]
                    if (log == null || log.status != LogStatus.COMPLETED) {
                        if (log?.status != LogStatus.SKIPPED) {
                            missedByDayOfWeek[dow] = (missedByDayOfWeek[dow] ?: 0) + 1
                        }
                    }
                }
            }

            for ((dow, missCount) in missedByDayOfWeek) {
                val scheduled = scheduledByDayOfWeek[dow] ?: 0
                // Require at least 2 misses and miss rate >= 40%
                if (missCount >= 2 && scheduled >= 3 && (missCount.toDouble() / scheduled) >= 0.4) {
                    val dayName = dow.getDisplayName(TextStyle.FULL, Locale.getDefault())
                    insights.add(
                        MissedInsight(
                            routineId = routine.id,
                            routineName = routine.name,
                            dayOfWeek = dow,
                            missCount = missCount,
                            message = "You frequently miss ${routine.name} on ${dayName}s ($missCount missed out of $scheduled scheduled)."
                        )
                    )
                }
            }
        }
        return insights
    }
}
