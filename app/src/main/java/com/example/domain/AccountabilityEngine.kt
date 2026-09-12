package com.example.domain

import com.example.data.model.Routine
import java.time.LocalDate
import java.time.LocalTime

sealed class DashboardState {
    data class RestDay(
        val message: String = "Rest Day • No routines scheduled"
    ) : DashboardState()

    data class Completed(
        val completedCount: Int,
        val totalPlanned: Int,
        val message: String = "🏆 All routines completed! Day complete.",
        val emoji: String = "🏆"
    ) : DashboardState()

    data class InProgress(
        val completedCount: Int,
        val totalPlanned: Int,
        val percentage: Double,
        val remainingCount: Int,
        val message: String = "⚡ Progress underway • $remainingCount remaining",
        val emoji: String = "⚡"
    ) : DashboardState()

    data class Accountability(
        val missedCount: Int,
        val totalPlanned: Int,
        val completedCount: Int,
        val percentage: Double,
        val missedRoutines: List<Routine>,
        val emoji: String, // 😠 or 😤
        val title: String, // e.g., "😠 1 routine remaining" or "😤 2 routines were left incomplete."
        val message: String
    ) : DashboardState()
}

object AccountabilityEngine {

    /**
     * Resolves the emotional accountability or celebration state for the given date.
     * Strictly enforces the rule that 😠 or 😤 are NEVER shown for:
     * - No routines planned
     * - Intentionally skipped routines
     * - Paused routines
     * - Rescheduled routines
     * - Future dates
     * - 100% completed qualifying routines
     */
    fun resolveDashboardState(
        dailyProgress: DailyProgressResult?,
        selectedDate: LocalDate,
        currentDate: LocalDate = LocalDate.now(),
        currentTime: LocalTime = LocalTime.now()
    ): DashboardState {
        if (dailyProgress == null || dailyProgress.totalPlanned == 0) {
            return DashboardState.RestDay("Rest Day • No routines scheduled")
        }

        val activePlanned = (dailyProgress.totalPlanned - dailyProgress.skippedCount).coerceAtLeast(0)

        // All scheduled routines were intentionally skipped
        if (activePlanned == 0) {
            return DashboardState.RestDay("All routines were skipped for this day")
        }

        val completedCount = dailyProgress.completedCount
        val percentage = dailyProgress.completionPercentage ?: 0.0

        // 100% qualifying routines completed
        if (completedCount >= activePlanned) {
            return DashboardState.Completed(
                completedCount = completedCount,
                totalPlanned = activePlanned,
                message = "🏆 All routines completed! Day complete.",
                emoji = "🏆"
            )
        }

        // Future dates are upcoming, not missed
        if (selectedDate.isAfter(currentDate)) {
            val remaining = (activePlanned - completedCount).coerceAtLeast(0)
            return DashboardState.InProgress(
                completedCount = completedCount,
                totalPlanned = activePlanned,
                percentage = percentage,
                remainingCount = remaining,
                message = "Upcoming plan • $remaining routine${if (remaining > 1) "s" else ""} scheduled",
                emoji = "⚡"
            )
        }

        // Identify which planned routines remain incomplete and unskipped
        val incompleteRoutines = dailyProgress.plannedRoutines.filter { routine ->
            !dailyProgress.completedRoutineIds.contains(routine.id) &&
                    !dailyProgress.skippedRoutineIds.contains(routine.id)
        }

        // Check if viewing a past day: all incomplete routines are genuinely missed
        val isPastDay = selectedDate.isBefore(currentDate)

        // Check if viewing today: determine which incomplete routines are overdue or if day is ending
        val missedRoutines = if (isPastDay) {
            incompleteRoutines
        } else {
            // Today: a routine is missed/overdue if current time has passed its scheduled time,
            // OR if it's evening / end of day (>= 18:00)
            val isEveningOrEndDay = currentTime.hour >= 18
            incompleteRoutines.filter { routine ->
                isEveningOrEndDay || currentTime.isAfter(LocalTime.of(routine.timeHour, routine.timeMinute))
            }
        }

        // If routines were genuinely missed/overdue
        if (missedRoutines.isNotEmpty()) {
            val missedCount = missedRoutines.size
            val emoji = if (missedCount >= 2) "😤" else "😠"
            val title = if (isPastDay) {
                if (missedCount == 1) "😠 1 routine was left incomplete."
                else "😤 $missedCount routines were left incomplete."
            } else {
                if (missedCount == 1) "😠 1 routine remaining"
                else "😤 $missedCount routines remaining"
            }

            val message = if (isPastDay) {
                "You didn't finish this day's plan. Get back on track."
            } else {
                "You planned this. You didn't complete it. Get back on track."
            }

            return DashboardState.Accountability(
                missedCount = missedCount,
                totalPlanned = activePlanned,
                completedCount = completedCount,
                percentage = percentage,
                missedRoutines = missedRoutines,
                emoji = emoji,
                title = title,
                message = message
            )
        }

        // Today, remaining routines are scheduled for later and day hasn't ended yet
        val remainingCount = (activePlanned - completedCount).coerceAtLeast(0)
        return DashboardState.InProgress(
            completedCount = completedCount,
            totalPlanned = activePlanned,
            percentage = percentage,
            remainingCount = remainingCount,
            message = "⚡ Progress underway • $remainingCount remaining • Keep going!",
            emoji = "⚡"
        )
    }
}
