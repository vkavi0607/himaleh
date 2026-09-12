package com.example.domain

import com.example.data.model.*
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class DailyProgressResult(
    val date: LocalDate,
    val totalPlanned: Int,
    val completedCount: Int,
    val skippedCount: Int,
    val missedCount: Int,
    val completionPercentage: Double?, // null if totalPlanned == 0
    val plannedRoutines: List<Routine>,
    val completedRoutineIds: Set<Long>,
    val skippedRoutineIds: Set<Long>,
    val routineLogMap: Map<Long, RoutineLog>
)

data class GoalProgressResult(
    val goalId: Long,
    val currentValue: Double,
    val targetValue: Double,
    val percentage: Double, // 0.0 to 100.0
    val isCompleted: Boolean,
    val linkedRoutineCount: Int,
    val milestones: List<GoalMilestone>,
    val newlyAchievedMilestones: List<GoalMilestone>
)

object ProgressCalculationEngine {
    val DATE_FORMATTER: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE // YYYY-MM-DD

    /**
     * Checks if a routine is planned to occur on a given date.
     */
    fun isRoutineScheduledForDate(
        routine: Routine,
        date: LocalDate,
        logsForRoutine: List<RoutineLog> = emptyList()
    ): Boolean {
        // Paused routines do not generate expected occurrences
        if (routine.isPaused) return false

        val dateStr = date.format(DATE_FORMATTER)

        // Check if start date is reached
        val startDate = try {
            LocalDate.parse(routine.startDate, DATE_FORMATTER)
        } catch (e: Exception) {
            LocalDate.MIN
        }
        if (date.isBefore(startDate)) return false

        // Check if end date has passed
        if (!routine.endDate.isNullOrBlank()) {
            val endDate = try {
                LocalDate.parse(routine.endDate, DATE_FORMATTER)
            } catch (e: Exception) {
                LocalDate.MAX
            }
            if (date.isAfter(endDate)) return false
        }

        // Check if this routine was explicitly rescheduled AWAY from this date
        val logForDate = logsForRoutine.find { it.date == dateStr }
        if (logForDate?.status == LogStatus.RESCHEDULED) {
            return false
        }

        // Check if another occurrence was rescheduled TO this date
        val rescheduledToToday = logsForRoutine.any {
            it.status == LogStatus.RESCHEDULED && it.rescheduledToDate == dateStr
        }
        if (rescheduledToToday) {
            return true
        }

        // Check recurring frequency
        return when (routine.frequency) {
            RoutineFrequency.DAILY -> true
            RoutineFrequency.WEEKDAYS -> {
                val dow = date.dayOfWeek
                dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY
            }
            RoutineFrequency.WEEKLY_X_TIMES -> {
                // For X times per week routines, they are planned if days are configured or open
                val activeDays = parseFrequencyDays(routine.frequencyDays)
                if (activeDays.isEmpty()) true else activeDays.contains(date.dayOfWeek.value)
            }
            RoutineFrequency.CUSTOM_DAYS -> {
                val activeDays = parseFrequencyDays(routine.frequencyDays)
                activeDays.contains(date.dayOfWeek.value)
            }
        }
    }

    fun parseFrequencyDays(daysStr: String): Set<Int> {
        if (daysStr.isBlank()) return setOf(1, 2, 3, 4, 5, 6, 7)
        return daysStr.split(",")
            .mapNotNull { it.trim().toIntOrNull() }
            .filter { it in 1..7 }
            .toSet()
    }

    /**
     * Calculates daily progress metrics for a given date.
     */
    fun calculateDailyProgress(
        routines: List<Routine>,
        logsForDate: List<RoutineLog>,
        allLogs: List<RoutineLog> = emptyList(),
        date: LocalDate
    ): DailyProgressResult {
        val dateStr = date.format(DATE_FORMATTER)
        val logsByRoutine = allLogs.groupBy { it.routineId }

        val planned = routines.filter { routine ->
            isRoutineScheduledForDate(
                routine = routine,
                date = date,
                logsForRoutine = logsByRoutine[routine.id] ?: emptyList()
            )
        }

        val logMap = mutableMapOf<Long, RoutineLog>()
        logsForDate.forEach { log ->
            logMap[log.routineId] = log
        }

        val completedIds = mutableSetOf<Long>()
        val skippedIds = mutableSetOf<Long>()

        for (routine in planned) {
            val log = logMap[routine.id]
            if (log != null) {
                when (log.status) {
                    LogStatus.COMPLETED -> completedIds.add(routine.id)
                    LogStatus.SKIPPED -> skippedIds.add(routine.id)
                    LogStatus.RESCHEDULED -> { /* Not planned on this day */ }
                }
            }
        }

        val completedCount = completedIds.size
        val skippedCount = skippedIds.size
        val totalPlanned = planned.size

        // In terms of required work:
        // If all tasks are skipped, it's a neutral day (100% skipped)
        // Qualifying completion % = completed / (totalPlanned - skipped) or completed / totalPlanned
        val activePlanned = (totalPlanned - skippedCount).coerceAtLeast(0)
        val missedCount = (activePlanned - completedCount).coerceAtLeast(0)

        val percentage = when {
            totalPlanned == 0 -> null // No scheduled routines
            activePlanned == 0 -> 100.0 // All scheduled were legitimately skipped
            else -> {
                val raw = (completedCount.toDouble() / activePlanned.toDouble()) * 100.0
                (Math.round(raw * 10.0) / 10.0).coerceIn(0.0, 100.0)
            }
        }

        return DailyProgressResult(
            date = date,
            totalPlanned = totalPlanned,
            completedCount = completedCount,
            skippedCount = skippedCount,
            missedCount = missedCount,
            completionPercentage = percentage,
            plannedRoutines = planned,
            completedRoutineIds = completedIds,
            skippedRoutineIds = skippedIds,
            routineLogMap = logMap
        )
    }

    /**
     * Calculates the progress of a Goal based on measurable targets and linked routines.
     */
    fun calculateGoalProgress(
        goal: Goal,
        linkedRoutines: List<Routine>,
        allLogs: List<RoutineLog>,
        milestones: List<GoalMilestone>
    ): GoalProgressResult {
        val linkedRoutineIds = linkedRoutines.map { it.id }.toSet()
        val relevantLogs = allLogs.filter { it.routineId in linkedRoutineIds && it.status == LogStatus.COMPLETED }

        var calculatedCurrent = 0.0

        if (goal.targetValue > 0) {
            val hasMeasurableRoutines = linkedRoutines.any {
                it.taskType != TaskType.CHECKBOX
            }

            if (hasMeasurableRoutines) {
                // Sum actual values (duration, quantity, count)
                calculatedCurrent = relevantLogs.sumOf { it.actualValue }
            } else {
                // Checkbox or frequency count
                calculatedCurrent = relevantLogs.size.toDouble()
            }
        }

        val target = if (goal.targetValue > 0) goal.targetValue else 1.0
        val rawPercentage = (calculatedCurrent / target) * 100.0
        val percentage = (Math.round(rawPercentage * 10.0) / 10.0).coerceIn(0.0, 100.0)
        val isCompleted = calculatedCurrent >= target || goal.status == GoalStatus.COMPLETED

        // Check milestones
        val newlyAchieved = mutableListOf<GoalMilestone>()
        val updatedMilestones = milestones.map { milestone ->
            if (milestone.achievedAt == null && percentage >= milestone.targetPercentage) {
                val achieved = milestone.copy(achievedAt = System.currentTimeMillis())
                newlyAchieved.add(achieved)
                achieved
            } else {
                milestone
            }
        }

        return GoalProgressResult(
            goalId = goal.id,
            currentValue = Math.round(calculatedCurrent * 100.0) / 100.0,
            targetValue = goal.targetValue,
            percentage = percentage,
            isCompleted = isCompleted,
            linkedRoutineCount = linkedRoutines.size,
            milestones = updatedMilestones,
            newlyAchievedMilestones = newlyAchieved
        )
    }
}
