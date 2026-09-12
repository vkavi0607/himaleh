package com.example

import com.example.data.model.*
import com.example.domain.ProgressCalculationEngine
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class ProgressCalculationEngineTest {

    @Test
    fun testIsRoutineScheduledForDate_daily() {
        val routine = Routine(
            id = 1,
            name = "Morning Meditation",
            startDate = "2026-01-01",
            frequency = RoutineFrequency.DAILY
        )
        val testDate = LocalDate.parse("2026-01-15")
        assertTrue(ProgressCalculationEngine.isRoutineScheduledForDate(routine, testDate))
    }

    @Test
    fun testIsRoutineScheduledForDate_weekdays() {
        val routine = Routine(
            id = 1,
            name = "Work Focus",
            startDate = "2026-01-01",
            frequency = RoutineFrequency.WEEKDAYS
        )
        // 2026-01-16 is Friday, 2026-01-17 is Saturday
        val friday = LocalDate.parse("2026-01-16")
        val saturday = LocalDate.parse("2026-01-17")

        assertTrue(ProgressCalculationEngine.isRoutineScheduledForDate(routine, friday))
        assertFalse(ProgressCalculationEngine.isRoutineScheduledForDate(routine, saturday))
    }

    @Test
    fun testIsRoutineScheduledForDate_paused() {
        val routine = Routine(
            id = 1,
            name = "Paused Habit",
            startDate = "2026-01-01",
            isPaused = true
        )
        val testDate = LocalDate.parse("2026-01-15")
        assertFalse(ProgressCalculationEngine.isRoutineScheduledForDate(routine, testDate))
    }

    @Test
    fun testIsRoutineScheduledForDate_rescheduled() {
        val routine = Routine(
            id = 1,
            name = "Workout",
            startDate = "2026-01-01",
            frequency = RoutineFrequency.DAILY
        )
        val dateA = LocalDate.parse("2026-01-10")
        val dateB = LocalDate.parse("2026-01-11")

        val rescheduleLog = RoutineLog(
            routineId = 1,
            date = "2026-01-10",
            status = LogStatus.RESCHEDULED,
            rescheduledToDate = "2026-01-11"
        )

        // On date A it should NOT be scheduled because it was moved away
        assertFalse(ProgressCalculationEngine.isRoutineScheduledForDate(routine, dateA, listOf(rescheduleLog)))
        // On date B it IS scheduled because it was moved to date B
        assertTrue(ProgressCalculationEngine.isRoutineScheduledForDate(routine, dateB, listOf(rescheduleLog)))
    }

    @Test
    fun testCalculateDailyProgress_allCompleted() {
        val routine1 = Routine(id = 1, name = "R1", startDate = "2026-01-01")
        val routine2 = Routine(id = 2, name = "R2", startDate = "2026-01-01")

        val testDate = LocalDate.parse("2026-01-15")
        val logs = listOf(
            RoutineLog(routineId = 1, date = "2026-01-15", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 2, date = "2026-01-15", status = LogStatus.COMPLETED)
        )

        val result = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine1, routine2),
            logsForDate = logs,
            date = testDate
        )

        assertEquals(2, result.totalPlanned)
        assertEquals(2, result.completedCount)
        assertEquals(0, result.missedCount)
        assertEquals(100.0, result.completionPercentage!!, 0.01)
    }

    @Test
    fun testCalculateDailyProgress_partialWithSkip() {
        val routine1 = Routine(id = 1, name = "R1", startDate = "2026-01-01")
        val routine2 = Routine(id = 2, name = "R2", startDate = "2026-01-01")

        val testDate = LocalDate.parse("2026-01-15")
        val logs = listOf(
            RoutineLog(routineId = 1, date = "2026-01-15", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 2, date = "2026-01-15", status = LogStatus.SKIPPED)
        )

        val result = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine1, routine2),
            logsForDate = logs,
            date = testDate
        )

        assertEquals(2, result.totalPlanned)
        assertEquals(1, result.completedCount)
        assertEquals(1, result.skippedCount)
        // Since routine2 was legitimately skipped, the 1 non-skipped routine was completed -> 100%
        assertEquals(100.0, result.completionPercentage!!, 0.01)
    }

    @Test
    fun testCalculateGoalProgress_withMilestones() {
        val goal = Goal(
            id = 10,
            title = "Read 1000 Pages",
            targetValue = 1000.0,
            unit = "pages",
            startDate = "2026-01-01",
            endDate = "2026-12-31"
        )
        val routine = Routine(
            id = 1,
            name = "Reading",
            linkedGoalId = 10,
            taskType = TaskType.COUNT,
            startDate = "2026-01-01"
        )
        val milestones = listOf(
            GoalMilestone(id = 1, goalId = 10, targetPercentage = 25, targetValue = 250.0, title = "25%"),
            GoalMilestone(id = 2, goalId = 10, targetPercentage = 50, targetValue = 500.0, title = "50%"),
            GoalMilestone(id = 3, goalId = 10, targetPercentage = 100, targetValue = 1000.0, title = "100%")
        )
        val logs = listOf(
            RoutineLog(routineId = 1, date = "2026-01-02", actualValue = 150.0, status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = "2026-01-03", actualValue = 150.0, status = LogStatus.COMPLETED)
        )

        val result = ProgressCalculationEngine.calculateGoalProgress(
            goal = goal,
            linkedRoutines = listOf(routine),
            allLogs = logs,
            milestones = milestones
        )

        assertEquals(300.0, result.currentValue, 0.01)
        assertEquals(30.0, result.percentage, 0.01)
        assertFalse(result.isCompleted)
        assertEquals(1, result.newlyAchievedMilestones.size)
        assertEquals("25%", result.newlyAchievedMilestones[0].title)
    }
}
