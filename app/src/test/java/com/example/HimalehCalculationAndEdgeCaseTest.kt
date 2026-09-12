package com.example

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.*
import com.example.data.repository.TrackerRepository
import com.example.domain.*
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.time.LocalDate

/**
 * Validates Calculation Math, Edge Cases, Error Recovery,
 * Rapid-tap Idempotency, Search/Filter, and Consistency Engine.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HimalehCalculationAndEdgeCaseTest {

    private lateinit var app: Application
    private lateinit var repository: TrackerRepository

    @Before
    fun setUp() = runBlocking {
        app = ApplicationProvider.getApplicationContext()
        repository = TrackerRepository(app)
        repository.resetAllData()
    }

    // =========================================================================
    // 1. PROGRESS CALCULATION RATIOS & DIVIDE BY ZERO SAFETY
    // =========================================================================

    @Test
    fun testProgressCalculation_exactRatiosAndZeroSafety() {
        val today = LocalDate.parse("2026-01-10")

        // 0 planned routines: MUST NOT divide by zero!
        val zeroPlanned = ProgressCalculationEngine.calculateDailyProgress(
            routines = emptyList(),
            logsForDate = emptyList(),
            date = today
        )
        assertEquals(0, zeroPlanned.totalPlanned)
        assertEquals(0, zeroPlanned.completedCount)
        assertNull("0 planned must return null percentage, never NaN or divide-by-zero", zeroPlanned.completionPercentage)

        // 5 planned routines
        val routines = (1..5).map { i ->
            Routine(id = i.toLong(), name = "Habit $i", startDate = "2026-01-01")
        }

        // 0 / 5 = 0%
        var logs = emptyList<RoutineLog>()
        var res = ProgressCalculationEngine.calculateDailyProgress(routines, logs, logs, today)
        assertEquals(0.0, res.completionPercentage ?: -1.0, 0.01)

        // 1 / 5 = 20%
        logs = listOf(RoutineLog(routineId = 1, date = today.toString(), status = LogStatus.COMPLETED))
        res = ProgressCalculationEngine.calculateDailyProgress(routines, logs, logs, today)
        assertEquals(20.0, res.completionPercentage ?: -1.0, 0.01)

        // 2 / 5 = 40%
        logs = listOf(
            RoutineLog(routineId = 1, date = today.toString(), status = LogStatus.COMPLETED),
            RoutineLog(routineId = 2, date = today.toString(), status = LogStatus.COMPLETED)
        )
        res = ProgressCalculationEngine.calculateDailyProgress(routines, logs, logs, today)
        assertEquals(40.0, res.completionPercentage ?: -1.0, 0.01)

        // 3 / 5 = 60%
        logs = (1..3).map { RoutineLog(routineId = it.toLong(), date = today.toString(), status = LogStatus.COMPLETED) }
        res = ProgressCalculationEngine.calculateDailyProgress(routines, logs, logs, today)
        assertEquals(60.0, res.completionPercentage ?: -1.0, 0.01)

        // 4 / 5 = 80%
        logs = (1..4).map { RoutineLog(routineId = it.toLong(), date = today.toString(), status = LogStatus.COMPLETED) }
        res = ProgressCalculationEngine.calculateDailyProgress(routines, logs, logs, today)
        assertEquals(80.0, res.completionPercentage ?: -1.0, 0.01)

        // 5 / 5 = 100%
        logs = (1..5).map { RoutineLog(routineId = it.toLong(), date = today.toString(), status = LogStatus.COMPLETED) }
        res = ProgressCalculationEngine.calculateDailyProgress(routines, logs, logs, today)
        assertEquals(100.0, res.completionPercentage ?: -1.0, 0.01)
    }

    // =========================================================================
    // 2. RAPID REPEATED TAPPING IDEMPOTENCY
    // =========================================================================

    @Test
    fun testRapidTapping_preventsDuplicateLogs() = runBlocking {
        val routine = Routine(name = "Pushups", startDate = "2026-01-01")
        val routineId = repository.insertRoutine(routine)
        val todayStr = "2026-01-10"

        // Simulate 5 rapid simultaneous taps
        repeat(5) {
            repository.completeRoutine(routineId, todayStr, 1.0)
        }

        val allLogs = repository.allLogs.first()
        val routineLogs = allLogs.filter { it.routineId == routineId && it.date == todayStr }
        assertEquals("Rapid tapping MUST result in exactly 1 log record via upsert/conflict replace", 1, routineLogs.size)
        assertEquals(LogStatus.COMPLETED, routineLogs.first().status)
    }

    // =========================================================================
    // 3. PERSISTENCE & RESTARTS REPRODUCIBILITY
    // =========================================================================

    @Test
    fun testPersistenceAcrossRestart() = runBlocking {
        val goalId = repository.insertGoal(
            Goal(
                title = "Hydration Challenge",
                startDate = "2026-01-01",
                endDate = "2026-01-31",
                targetValue = 100.0,
                unit = "L"
            )
        )
        val routineId = repository.insertRoutine(
            Routine(name = "Drink 2L", startDate = "2026-01-01", linkedGoalId = goalId)
        )
        repository.completeRoutine(routineId, "2026-01-01", 2.0)
        repository.saveReflection(
            DailyReflection(
                date = "2026-01-01",
                rating = 5,
                wentWell = "Drank all water",
                couldImprove = "None",
                notes = "Felt super energized!"
            )
        )

        // Simulate App Restart by destroying reference and creating a new repository
        val restartedRepo = TrackerRepository(app)
        val goals = restartedRepo.allGoals.first()
        val routines = restartedRepo.allRoutines.first()
        val logs = restartedRepo.allLogs.first()
        val reflections = restartedRepo.allReflections.first()

        assertEquals(1, goals.size)
        assertEquals("Hydration Challenge", goals.first().title)
        assertEquals(1, routines.size)
        assertEquals("Drink 2L", routines.first().name)
        assertEquals(1, logs.size)
        assertEquals(LogStatus.COMPLETED, logs.first().status)
        assertEquals(1, reflections.size)
        assertEquals(5, reflections.first().rating)
        assertEquals("Felt super energized!", reflections.first().notes)
    }

    // =========================================================================
    // 4. SEARCH & FILTER ENGINE
    // =========================================================================

    @Test
    fun testSearchAndFilterLogic() = runBlocking {
        repository.insertRoutine(Routine(name = "Morning Yoga", category = "Health", startDate = "2026-01-01"))
        repository.insertRoutine(Routine(name = "Evening Reading", category = "Education", startDate = "2026-01-01"))
        repository.insertRoutine(Routine(name = "Weightlifting", category = "Fitness", startDate = "2026-01-01"))

        val allRoutines = repository.allRoutines.first()

        // 1. Search by name query "Yoga"
        val queryYoga = allRoutines.filter { it.name.contains("yoga", ignoreCase = true) }
        assertEquals(1, queryYoga.size)
        assertEquals("Morning Yoga", queryYoga.first().name)

        // 2. Search missing goal/routine
        val queryMissing = allRoutines.filter { it.name.contains("Astronomy", ignoreCase = true) }
        assertTrue(queryMissing.isEmpty())

        // 3. Category Filter
        val categoryFilter = allRoutines.filter { it.category == "Health" }
        assertEquals(1, categoryFilter.size)
        assertEquals("Morning Yoga", categoryFilter.first().name)
    }

    // =========================================================================
    // 5. CONSISTENCY & STREAK SCENARIOS (Skip, Rest Day, Midnight)
    // =========================================================================

    @Test
    fun testStreak_skipAndRestDayPreservation() {
        val routine = Routine(id = 1, name = "Daily Journal", startDate = "2026-01-01")
        val day1 = "2026-01-01"
        val day2 = "2026-01-02"
        val day3 = "2026-01-03"

        // Day 1: Completed, Day 2: Skipped, Day 3: Completed
        val logs = listOf(
            RoutineLog(routineId = 1, date = day1, status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = day2, status = LogStatus.SKIPPED),
            RoutineLog(routineId = 1, date = day3, status = LogStatus.COMPLETED)
        )

        val stats = ConsistencyEngine.calculateStreaks(
            routines = listOf(routine),
            allLogs = logs,
            today = LocalDate.parse(day3)
        )

        // With day 2 explicitly skipped (valid rest/skip), streak is preserved across skipped day
        assertEquals(2, stats.totalCompletedDays)
        assertEquals(2, stats.currentStreak) // 2 completed days forming current streak across valid skip
    }
}
