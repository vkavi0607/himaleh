package com.example

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.*
import com.example.data.repository.TrackerRepository
import com.example.domain.AccountabilityEngine
import com.example.domain.ConsistencyEngine
import com.example.domain.DashboardState
import com.example.domain.ProgressCalculationEngine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.time.LocalDate
import java.time.LocalTime

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class AccountabilityAndCelebrationFeedbackTest {

    private lateinit var app: Application
    private lateinit var repository: TrackerRepository

    @Before
    fun setUp() = runBlocking {
        app = ApplicationProvider.getApplicationContext()
        repository = TrackerRepository(app)
        repository.resetAllData()
    }

    // --- Scenario 1: 0% completed ---
    @Test
    fun testScenario1_zeroPercentCompleted() {
        val routine1 = Routine(id = 1, name = "Morning Run", startDate = "2026-01-01", timeHour = 8, timeMinute = 0)
        val routine2 = Routine(id = 2, name = "Meditation", startDate = "2026-01-01", timeHour = 9, timeMinute = 0)
        val today = LocalDate.parse("2026-01-04")

        // Progress calculated for today with 0 logs
        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine1, routine2),
            logsForDate = emptyList(),
            date = today
        )
        assertEquals(0, progress.completedCount)
        assertEquals(0.0, progress.completionPercentage ?: 0.0, 0.01)

        // If daytime before scheduled time (e.g., 7:00 AM), it is in progress, NOT missed
        val earlyState = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(7, 0)
        )
        assertTrue(earlyState is DashboardState.InProgress)
        assertEquals("⚡", (earlyState as DashboardState.InProgress).emoji)

        // If evening (e.g., 19:00 PM), uncompleted routines are overdue/missed -> Accountability
        val lateState = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(19, 0)
        )
        assertTrue(lateState is DashboardState.Accountability)
        assertEquals("😤", (lateState as DashboardState.Accountability).emoji)
        assertEquals(2, lateState.missedCount)
    }

    // --- Scenario 2: Partially completed ---
    @Test
    fun testScenario2_partiallyCompleted() {
        val routine1 = Routine(id = 1, name = "Exercise", startDate = "2026-01-01", timeHour = 7, timeMinute = 0)
        val routine2 = Routine(id = 2, name = "Evening Reading", startDate = "2026-01-01", timeHour = 20, timeMinute = 0)
        val today = LocalDate.parse("2026-01-04")
        val log1 = RoutineLog(routineId = 1, date = "2026-01-04", status = LogStatus.COMPLETED)

        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine1, routine2),
            logsForDate = listOf(log1),
            date = today
        )
        assertEquals(1, progress.completedCount)
        assertEquals(50.0, progress.completionPercentage ?: 0.0, 0.01)

        // During afternoon (14:00 PM) before evening reading: InProgress (⚡)
        val midDayState = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(14, 0)
        )
        assertTrue(midDayState is DashboardState.InProgress)

        // Late night (21:30 PM) after scheduled time: Accountability (😠 1 routine remaining)
        val nightState = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(21, 30)
        )
        assertTrue(nightState is DashboardState.Accountability)
        val acc = nightState as DashboardState.Accountability
        assertEquals("😠", acc.emoji)
        assertEquals(1, acc.missedCount)
        assertEquals(50.0, acc.percentage, 0.01)
    }

    // --- Scenario 3: 100% completed ---
    @Test
    fun testScenario3_oneHundredPercentCompleted() {
        val routine1 = Routine(id = 1, name = "Coding", startDate = "2026-01-01")
        val today = LocalDate.parse("2026-01-04")
        val log1 = RoutineLog(routineId = 1, date = "2026-01-04", status = LogStatus.COMPLETED)

        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine1),
            logsForDate = listOf(log1),
            date = today
        )
        assertEquals(100.0, progress.completionPercentage ?: 0.0, 0.01)

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(22, 0)
        )
        assertTrue("100% completion must result in Completed state, never Accountability", state is DashboardState.Completed)
        assertEquals("🏆", (state as DashboardState.Completed).emoji)
    }

    // --- Scenario 4: One routine genuinely missed ---
    @Test
    fun testScenario4_oneRoutineGenuinelyMissed() {
        val routine = Routine(id = 1, name = "Deep Work", startDate = "2026-01-01")
        val yesterday = LocalDate.parse("2026-01-03")
        val today = LocalDate.parse("2026-01-04")

        // Yesterday had no completed logs
        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine),
            logsForDate = emptyList(),
            date = yesterday
        )

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = yesterday,
            currentDate = today
        )
        assertTrue(state is DashboardState.Accountability)
        val acc = state as DashboardState.Accountability
        assertEquals("😠", acc.emoji)
        assertEquals(1, acc.missedCount)
        assertEquals(listOf(routine), acc.missedRoutines)
    }

    // --- Scenario 5: Multiple routines genuinely missed ---
    @Test
    fun testScenario5_multipleRoutinesGenuinelyMissed() {
        val r1 = Routine(id = 1, name = "Routine 1", startDate = "2026-01-01")
        val r2 = Routine(id = 2, name = "Routine 2", startDate = "2026-01-01")
        val r3 = Routine(id = 3, name = "Routine 3", startDate = "2026-01-01")
        val pastDate = LocalDate.parse("2026-01-02")
        val today = LocalDate.parse("2026-01-04")

        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(r1, r2, r3),
            logsForDate = emptyList(),
            date = pastDate
        )

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = pastDate,
            currentDate = today
        )
        assertTrue(state is DashboardState.Accountability)
        val acc = state as DashboardState.Accountability
        assertEquals("😤", acc.emoji)
        assertEquals(3, acc.missedCount)
        assertEquals(3, acc.missedRoutines.size)
    }

    // --- Scenario 6: Routine intentionally skipped (must NOT trigger 😠) ---
    @Test
    fun testScenario6_routineIntentionallySkipped_doesNotTriggerAngry() {
        val routine = Routine(id = 1, name = "Rest Day Workout", startDate = "2026-01-01")
        val today = LocalDate.parse("2026-01-04")
        val skipLog = RoutineLog(routineId = 1, date = "2026-01-04", status = LogStatus.SKIPPED)

        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine),
            logsForDate = listOf(skipLog),
            date = today
        )

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(22, 0)
        )
        assertFalse("Intentionally skipped routine must NOT trigger Accountability 😠", state is DashboardState.Accountability)
        assertTrue("Skipped routine should resolve to RestDay/neutral state", state is DashboardState.RestDay)
    }

    // --- Scenario 7: Routine paused (must NOT trigger 😠) ---
    @Test
    fun testScenario7_routinePaused_doesNotTriggerAngry() {
        val pausedRoutine = Routine(
            id = 1,
            name = "Gym (Paused while injured)",
            startDate = "2026-01-01",
            isPaused = true
        )
        val today = LocalDate.parse("2026-01-04")

        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(pausedRoutine),
            logsForDate = emptyList(),
            date = today
        )

        assertEquals(0, progress.totalPlanned)

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(23, 0)
        )
        assertFalse("Paused routine must NEVER trigger Accountability 😠", state is DashboardState.Accountability)
        assertTrue(state is DashboardState.RestDay)
    }

    // --- Scenario 8: Routine rescheduled (must NOT trigger 😠) ---
    @Test
    fun testScenario8_routineRescheduled_doesNotTriggerAngry() {
        val routine = Routine(id = 1, name = "Dentist Visit", startDate = "2026-01-01")
        val today = LocalDate.parse("2026-01-04")
        val rescheduleLog = RoutineLog(
            routineId = 1,
            date = "2026-01-04",
            status = LogStatus.RESCHEDULED,
            rescheduledToDate = "2026-01-05"
        )

        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine),
            logsForDate = listOf(rescheduleLog),
            allLogs = listOf(rescheduleLog),
            date = today
        )

        assertEquals(0, progress.totalPlanned)

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(23, 0)
        )
        assertFalse("Rescheduled routine must NOT trigger Accountability 😠", state is DashboardState.Accountability)
        assertTrue(state is DashboardState.RestDay)
    }

    // --- Scenario 9: No routines planned (must NOT trigger 😠) ---
    @Test
    fun testScenario9_noRoutinesPlanned_doesNotTriggerAngry() {
        val today = LocalDate.parse("2026-01-04")
        val progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = emptyList(),
            logsForDate = emptyList(),
            date = today
        )
        assertEquals(0, progress.totalPlanned)

        val state = AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = today,
            currentDate = today,
            currentTime = LocalTime.of(23, 0)
        )
        assertFalse("No planned routines must NEVER trigger Accountability 😠", state is DashboardState.Accountability)
        assertTrue(state is DashboardState.RestDay)
    }

    // --- Scenario 10: Daily target completed (triggers celebration) ---
    @Test
    fun testScenario10_dailyTargetCompleted_triggersCelebration() {
        val dateStr = "2026-01-04"
        assertFalse(repository.hasCelebratedDaily(dateStr))

        repository.markCelebratedDaily(dateStr)
        assertTrue(repository.hasCelebratedDaily(dateStr))
    }

    // --- Scenario 11: Weekly target completed (triggers celebration) ---
    @Test
    fun testScenario11_weeklyTargetCompleted_triggersCelebration() {
        val weekKey = "2026-W01"
        assertFalse(repository.hasCelebratedWeekly(weekKey))

        repository.markCelebratedWeekly(weekKey)
        assertTrue(repository.hasCelebratedWeekly(weekKey))
    }

    // --- Scenario 12: Goal reaches 100% (triggers celebration) ---
    @Test
    fun testScenario12_goalReaches100Percent_triggersCelebration() = runBlocking {
        val goal = Goal(
            title = "Read 5 Books",
            startDate = "2026-01-01",
            endDate = "2026-02-01",
            targetValue = 5.0,
            unit = "books"
        )
        val goalId = repository.insertGoal(goal)
        assertFalse(repository.hasCelebratedGoal(goalId))

        repository.markCelebratedGoal(goalId)
        assertTrue(repository.hasCelebratedGoal(goalId))
    }

    // --- Scenario 13: Completion undone (proper rollback) ---
    @Test
    fun testScenario13_completionUndone_properRollback() = runBlocking {
        val routine = Routine(name = "Night Reflection", startDate = "2026-01-01")
        val routineId = repository.insertRoutine(routine)
        val dateStr = "2026-01-04"

        repository.completeRoutine(routineId, dateStr, 1.0)
        assertEquals(1, repository.allLogs.first().size)

        repository.undoRoutineCompletion(routineId, dateStr)
        assertEquals(0, repository.allLogs.first().size)
    }

    // --- Scenario 14: App restarted (no repeated celebrations) ---
    @Test
    fun testScenario14_appRestarted_noRepeatedCelebrations() {
        val dateStr = "2026-01-04"
        repository.markCelebratedDaily(dateStr)

        // Simulate app restart by creating a new repository instance pointing to same app SharedPreferences
        val newRepository = TrackerRepository(app)
        assertTrue("Celebration state must persist across app restarts", newRepository.hasCelebratedDaily(dateStr))
    }

    // --- Scenario 15: Next day begins (evaluates missed routines for previous day) ---
    @Test
    fun testScenario15_nextDayBegins_evaluatesMissedRoutinesForPreviousDay() {
        val routine = Routine(id = 1, name = "Daily Exercise", startDate = "2026-01-01")
        val day1 = LocalDate.parse("2026-01-04")
        val day2 = LocalDate.parse("2026-01-05")

        // On day 1, routine was not done
        val day1Progress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine),
            logsForDate = emptyList(),
            date = day1
        )

        // When day 2 begins, day 1 is in the past -> evaluated as genuinely missed!
        val day1StateFromDay2 = AccountabilityEngine.resolveDashboardState(
            dailyProgress = day1Progress,
            selectedDate = day1,
            currentDate = day2
        )
        assertTrue(day1StateFromDay2 is DashboardState.Accountability)
        val acc = day1StateFromDay2 as DashboardState.Accountability
        assertEquals(1, acc.missedCount)
        assertEquals("😠 1 routine was left incomplete.", acc.title)
    }
}
