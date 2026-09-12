package com.example

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.*
import com.example.data.repository.TrackerRepository
import com.example.domain.ConsistencyEngine
import com.example.domain.ProgressCalculationEngine
import com.example.ui.components.CelebrationEvent
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.IsoFields

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class CoreUxCelebrationAndDashboardTest {

    private lateinit var app: Application
    private lateinit var repository: TrackerRepository

    @Before
    fun setUp() = runBlocking {
        app = ApplicationProvider.getApplicationContext()
        repository = TrackerRepository(app)
        repository.resetAllData()
    }

    @Test
    fun testTaskCompletion_successfulDatabaseWriteAndUndo() = runBlocking {
        val routine = Routine(
            name = "Morning Stretch",
            startDate = "2026-01-01",
            category = "Health",
            frequency = RoutineFrequency.DAILY
        )
        val routineId = repository.insertRoutine(routine)
        val dateStr = "2026-01-04"

        // 1. Complete routine
        val completeSuccess = repository.completeRoutine(routineId, dateStr, 1.0)
        assertTrue("Repository must return true on successful completion", completeSuccess)

        val logsAfterComplete = repository.allLogs.first()
        val completedLog = logsAfterComplete.find { it.routineId == routineId && it.date == dateStr }
        assertNotNull("Log must be persisted", completedLog)
        assertEquals(LogStatus.COMPLETED, completedLog?.status)

        // 2. Undo routine completion
        val undoSuccess = repository.undoRoutineCompletion(routineId, dateStr)
        assertTrue("Repository must return true on successful undo", undoSuccess)

        val logsAfterUndo = repository.allLogs.first()
        val undoneLog = logsAfterUndo.find { it.routineId == routineId && it.date == dateStr }
        assertNull("Log must be removed after undo", undoneLog)
    }

    @Test
    fun testDailyCelebration_triggersOnlyOncePerDay() {
        val dateStr = "2026-01-04"

        assertFalse("Initially date must not have celebrated", repository.hasCelebratedDaily(dateStr))

        repository.markCelebratedDaily(dateStr)
        assertTrue("Date must be recorded as celebrated", repository.hasCelebratedDaily(dateStr))

        // Subsequent check remains true, preventing duplicate celebration triggers
        assertTrue("Subsequent check must remain true to avoid repeating celebration", repository.hasCelebratedDaily(dateStr))
    }

    @Test
    fun testWeeklyCelebration_triggersOnlyOncePerWeek() {
        val weekKey = "2026-W01"

        assertFalse("Initially week must not have celebrated", repository.hasCelebratedWeekly(weekKey))

        repository.markCelebratedWeekly(weekKey)
        assertTrue("Week must be recorded as celebrated", repository.hasCelebratedWeekly(weekKey))

        // Subsequent check remains true
        assertTrue(repository.hasCelebratedWeekly(weekKey))
    }

    @Test
    fun testGoalCelebration_triggersOnlyOncePerGoal() {
        val goalId = 42L

        assertFalse("Initially goal must not have celebrated", repository.hasCelebratedGoal(goalId))

        repository.markCelebratedGoal(goalId)
        assertTrue("Goal must be recorded as celebrated", repository.hasCelebratedGoal(goalId))

        // Subsequent check remains true
        assertTrue(repository.hasCelebratedGoal(goalId))
    }

    @Test
    fun testDailyProgressCalculation_reaches100PercentWhenAllPlannedRoutinesCompleted() = runBlocking {
        val routine1 = Routine(id = 1, name = "Routine 1", startDate = "2026-01-01")
        val routine2 = Routine(id = 2, name = "Routine 2", startDate = "2026-01-01")
        val date = LocalDate.parse("2026-01-04")
        val dateStr = "2026-01-04"

        val routines = listOf(routine1, routine2)

        // 0 of 2 completed
        val initialProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = emptyList(),
            allLogs = emptyList(),
            date = date
        )
        assertEquals(2, initialProgress.totalPlanned)
        assertEquals(0, initialProgress.completedCount)
        assertEquals(0.0, initialProgress.completionPercentage ?: 0.0, 0.01)

        // 1 of 2 completed -> 50%
        val log1 = RoutineLog(routineId = 1, date = dateStr, status = LogStatus.COMPLETED)
        val halfProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = listOf(log1),
            allLogs = listOf(log1),
            date = date
        )
        assertEquals(1, halfProgress.completedCount)
        assertEquals(50.0, halfProgress.completionPercentage ?: 0.0, 0.01)

        // 2 of 2 completed -> 100%
        val log2 = RoutineLog(routineId = 2, date = dateStr, status = LogStatus.COMPLETED)
        val fullProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = listOf(log1, log2),
            allLogs = listOf(log1, log2),
            date = date
        )
        assertEquals(2, fullProgress.completedCount)
        assertEquals(100.0, fullProgress.completionPercentage ?: 0.0, 0.01)
    }

    @Test
    fun testWeeklyConsistency_computesCompletedDaysCorrectly() {
        val routine = Routine(id = 1, name = "Daily Practice", startDate = "2026-01-01")
        // Sunday 2026-01-04
        val today = LocalDate.parse("2026-01-04")

        // 4 completed days in the week
        val logs = listOf(
            RoutineLog(routineId = 1, date = "2026-01-01", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = "2026-01-02", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = "2026-01-03", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = "2026-01-04", status = LogStatus.COMPLETED)
        )

        val stats = ConsistencyEngine.calculateStreaks(
            routines = listOf(routine),
            allLogs = logs,
            today = today
        )

        assertEquals(4, stats.currentStreak)
        assertEquals(4, stats.weeklyCompletedDays)
        assertEquals(5, stats.weeklyTargetDays)
    }

    @Test
    fun testGoalProgressCalculation_detects100PercentGoal() {
        val goal = Goal(
            id = 10,
            title = "Run 100km",
            startDate = "2026-01-01",
            endDate = "2026-01-31",
            targetValue = 100.0,
            unit = "km"
        )
        val routine = Routine(
            id = 20,
            name = "Jogging",
            startDate = "2026-01-01",
            linkedGoalId = 10,
            taskType = TaskType.QUANTITY,
            unit = "km"
        )
        val logs = listOf(
            RoutineLog(routineId = 20, date = "2026-01-01", actualValue = 40.0, status = LogStatus.COMPLETED),
            RoutineLog(routineId = 20, date = "2026-01-02", actualValue = 60.0, status = LogStatus.COMPLETED)
        )

        val goalProgress = ProgressCalculationEngine.calculateGoalProgress(
            goal = goal,
            linkedRoutines = listOf(routine),
            allLogs = logs,
            milestones = emptyList()
        )

        assertEquals(100.0, goalProgress.currentValue, 0.01)
        assertEquals(100.0, goalProgress.percentage, 0.01)
    }
}
