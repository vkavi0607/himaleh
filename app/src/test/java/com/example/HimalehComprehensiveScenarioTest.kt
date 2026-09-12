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
 * End-to-end user acceptance and scenario testing suite for Himaleh,
 * covering Scenario A (New User), Scenario B (Daily Routine User),
 * Scenario C (Weekly Routine User), and Scenario D (Long-Term 90-Day Goal).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HimalehComprehensiveScenarioTest {

    private lateinit var app: Application
    private lateinit var repository: TrackerRepository

    @Before
    fun setUp() = runBlocking {
        app = ApplicationProvider.getApplicationContext()
        repository = TrackerRepository(app)
        repository.resetAllData()
    }

    // =========================================================================
    // SCENARIO A: NEW USER (Clean slate, zero crashes, no misleading fake data)
    // =========================================================================

    @Test
    fun testScenarioA_newUserCleanSlate() = runBlocking {
        // 1. App starts completely empty
        val goals = repository.allGoals.first()
        val routines = repository.allRoutines.first()
        val logs = repository.allLogs.first()
        val reflections = repository.allReflections.first()

        assertTrue("New user must have 0 goals", goals.isEmpty())
        assertTrue("New user must have 0 routines", routines.isEmpty())
        assertTrue("New user must have 0 logs", logs.isEmpty())
        assertTrue("New user must have 0 reflections", reflections.isEmpty())

        // 2. Dashboard calculation for empty user
        val today = LocalDate.now()
        val dailyProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = logs,
            date = today
        )
        assertEquals(0, dailyProgress.totalPlanned)
        assertEquals(0, dailyProgress.completedCount)
        assertNull("Empty day must yield null percentage (no fake 0%)", dailyProgress.completionPercentage)

        // 3. Streak for empty user
        val streakStats = ConsistencyEngine.calculateStreaks(
            routines = routines,
            allLogs = logs,
            today = today
        )
        assertEquals(0, streakStats.currentStreak)
        assertEquals(0, streakStats.longestStreak)
        assertEquals(0.0, streakStats.weeklyConsistency, 0.01)

        // 4. Create first goal
        val goal = Goal(
            title = "Read 12 Books",
            description = "Yearly reading target",
            category = "Education",
            startDate = today.toString(),
            endDate = today.plusMonths(6).toString(),
            targetValue = 12.0,
            unit = "books"
        )
        val goalId = repository.insertGoal(goal)
        assertTrue(goalId > 0)

        // 5. Create first routine
        val routine = Routine(
            name = "Read 20 pages",
            category = "Education",
            startDate = today.toString(),
            frequency = RoutineFrequency.DAILY,
            taskType = TaskType.CHECKBOX,
            linkedGoalId = goalId
        )
        val routineId = repository.insertRoutine(routine)
        assertTrue(routineId > 0)

        // 6. First completion
        val completeSuccess = repository.completeRoutine(routineId, today.toString(), 1.0)
        assertTrue(completeSuccess)

        // 7. Verify first progress update
        val updatedLogs = repository.allLogs.first()
        val updatedProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = listOf(routine.copy(id = routineId)),
            logsForDate = updatedLogs,
            date = today
        )
        assertEquals(1, updatedProgress.totalPlanned)
        assertEquals(1, updatedProgress.completedCount)
        assertEquals(100.0, updatedProgress.completionPercentage ?: 0.0, 0.01)
    }

    // =========================================================================
    // SCENARIO B: DAILY ROUTINE USER (30-Day Challenge: Wake Up, Workout, Water, Reading)
    // =========================================================================

    @Test
    fun testScenarioB_dailyRoutineUser() = runBlocking {
        val today = LocalDate.parse("2026-01-05")
        val todayStr = today.toString()

        // Create Goal: 30 Day Fitness Challenge
        val goalId = repository.insertGoal(
            Goal(
                title = "30 Day Fitness Challenge",
                startDate = "2026-01-01",
                endDate = "2026-01-30",
                targetValue = 30.0,
                unit = "days"
            )
        )

        // Create 4 routines:
        // 1. Wake Up (Checkbox, 6:00 AM)
        val r1Id = repository.insertRoutine(
            Routine(name = "Wake Up", timeHour = 6, timeMinute = 0, startDate = "2026-01-01", taskType = TaskType.CHECKBOX)
        )
        // 2. Workout (Duration, 45 mins)
        val r2Id = repository.insertRoutine(
            Routine(name = "Workout", timeHour = 6, timeMinute = 30, targetValue = 45.0, unit = "min", startDate = "2026-01-01", taskType = TaskType.DURATION, linkedGoalId = goalId)
        )
        // 3. Drink Water (Quantity, 3 liters)
        val r3Id = repository.insertRoutine(
            Routine(name = "Drink Water", targetValue = 3.0, unit = "L", startDate = "2026-01-01", taskType = TaskType.QUANTITY)
        )
        // 4. Reading (Quantity, 20 pages)
        val r4Id = repository.insertRoutine(
            Routine(name = "Reading", targetValue = 20.0, unit = "pages", startDate = "2026-01-01", taskType = TaskType.QUANTITY)
        )

        val routines = repository.allRoutines.first()
        assertEquals(4, routines.size)

        // --- Step 1: Complete one task (Wake Up) ---
        repository.completeRoutine(r1Id, todayStr, 1.0)
        var logs = repository.allLogs.first()
        var progress = ProgressCalculationEngine.calculateDailyProgress(routines, logs.filter { it.date == todayStr }, logs, today)
        assertEquals(4, progress.totalPlanned)
        assertEquals(1, progress.completedCount)
        assertEquals(25.0, progress.completionPercentage ?: 0.0, 0.01)

        // --- Step 2: Complete second task (Workout 45 mins) ---
        repository.completeRoutine(r2Id, todayStr, 45.0)
        logs = repository.allLogs.first()
        progress = ProgressCalculationEngine.calculateDailyProgress(routines, logs.filter { it.date == todayStr }, logs, today)
        assertEquals(2, progress.completedCount)
        assertEquals(50.0, progress.completionPercentage ?: 0.0, 0.01)

        // Linked Goal progress should increment
        val currentGoal = repository.allGoals.first().find { it.id == goalId }!!
        val goalProgress = ProgressCalculationEngine.calculateGoalProgress(
            goal = currentGoal,
            linkedRoutines = routines.filter { it.linkedGoalId == goalId },
            allLogs = logs,
            milestones = emptyList()
        )
        assertEquals(45.0, goalProgress.currentValue, 0.01)

        // --- Step 3: Skip a task (Water) ---
        repository.skipRoutine(r3Id, todayStr, "Water filter broken")
        logs = repository.allLogs.first()
        progress = ProgressCalculationEngine.calculateDailyProgress(routines, logs.filter { it.date == todayStr }, logs, today)
        assertEquals(2, progress.completedCount)
        assertEquals(1, progress.skippedCount)
        assertEquals(66.7, progress.completionPercentage ?: 0.0, 0.01) // 2 out of 3 active planned (66.7%)

        // --- Step 4: Reschedule a task (Reading) ---
        val tomorrowStr = today.plusDays(1).toString()
        repository.rescheduleRoutine(r4Id, todayStr, tomorrowStr)
        logs = repository.allLogs.first()
        progress = ProgressCalculationEngine.calculateDailyProgress(routines, logs.filter { it.date == todayStr }, logs, today)
        // Reading moved to tomorrow: total planned for today is now 3 (Wake Up, Workout, Water skipped)
        // Active planned: 2 (Wake Up, Workout), both completed -> 100%!
        assertEquals(3, progress.totalPlanned)
        assertEquals(2, progress.completedCount)
        assertEquals(1, progress.skippedCount)
        assertEquals(100.0, progress.completionPercentage ?: 0.0, 0.01)

        // --- Step 5: Undo Workout completion ---
        repository.undoRoutineCompletion(r2Id, todayStr)
        logs = repository.allLogs.first()
        progress = ProgressCalculationEngine.calculateDailyProgress(routines, logs.filter { it.date == todayStr }, logs, today)
        assertEquals(1, progress.completedCount)
        assertEquals(50.0, progress.completionPercentage ?: 0.0, 0.01)

        // --- Step 6: Edit routine name ---
        val r1 = repository.allRoutines.first().find { it.id == r1Id }!!
        repository.updateRoutine(r1.copy(name = "Morning Wake Up Early"))
        val updatedR1 = repository.allRoutines.first().find { it.id == r1Id }!!
        assertEquals("Morning Wake Up Early", updatedR1.name)

        // --- Step 7: Delete routine ---
        repository.deleteRoutine(updatedR1)
        val remainingRoutines = repository.allRoutines.first()
        assertEquals(3, remainingRoutines.size)
        assertNull(remainingRoutines.find { it.id == r1Id })
    }

    // =========================================================================
    // SCENARIO C: WEEKLY ROUTINE (Monday-Friday Study, 5 sessions target)
    // Mon: Completed, Tue: Completed, Wed: Missed, Thu: Skipped, Fri: Completed
    // =========================================================================

    @Test
    fun testScenarioC_weeklyRoutineStudyGoal() = runBlocking {
        // Week of Mon 2026-01-05 to Fri 2026-01-09
        val mon = "2026-01-05"
        val tue = "2026-01-06"
        val wed = "2026-01-07"
        val thu = "2026-01-08"
        val fri = "2026-01-09"

        val goalId = repository.insertGoal(
            Goal(
                title = "Weekly Study Goal",
                startDate = "2026-01-05",
                endDate = "2026-01-11",
                targetValue = 5.0,
                unit = "sessions"
            )
        )

        val routineId = repository.insertRoutine(
            Routine(
                name = "Study",
                startDate = "2026-01-05",
                frequency = RoutineFrequency.WEEKDAYS,
                taskType = TaskType.DURATION,
                targetValue = 2.0,
                unit = "hours",
                linkedGoalId = goalId
            )
        )
        val routine = repository.allRoutines.first().find { it.id == routineId }!!

        // Mon: Completed
        repository.completeRoutine(routineId, mon, 2.0)
        // Tue: Completed
        repository.completeRoutine(routineId, tue, 2.0)
        // Wed: Missed (no log)
        // Thu: Skipped
        repository.skipRoutine(routineId, thu, "Family dinner")
        // Fri: Completed
        repository.completeRoutine(routineId, fri, 2.0)

        val allLogs = repository.allLogs.first()

        // 1. Verify missed and skipped are distinct
        val wedLog = allLogs.find { it.date == wed }
        assertNull("Missed day has no log record", wedLog)

        val thuLog = allLogs.find { it.date == thu }
        assertNotNull("Skipped day has SKIPPED status log", thuLog)
        assertEquals(LogStatus.SKIPPED, thuLog?.status)

        // 2. Weekly Completion: Mon, Tue, Fri completed. Wed missed (0%). Thu skipped (100% neutral/skipped).
        val weeklyDays = listOf(
            LocalDate.parse(mon),
            LocalDate.parse(tue),
            LocalDate.parse(wed),
            LocalDate.parse(thu),
            LocalDate.parse(fri)
        )
        val weekResults = weeklyDays.map { date ->
            ProgressCalculationEngine.calculateDailyProgress(
                routines = listOf(routine),
                logsForDate = allLogs.filter { it.date == date.toString() },
                allLogs = allLogs,
                date = date
            )
        }
        val actuallyCompletedDays = weekResults.count { it.completedCount > 0 }
        assertEquals("3 completed days (Mon, Tue, Fri)", 3, actuallyCompletedDays)

        // 3. Goal Target Verification: target was 5 sessions, 3 completed -> 60%
        val currentGoal = repository.allGoals.first().find { it.id == goalId }!!
        val goalProgress = ProgressCalculationEngine.calculateGoalProgress(
            goal = currentGoal,
            linkedRoutines = listOf(routine),
            allLogs = allLogs,
            milestones = emptyList()
        )
        assertEquals(6.0, goalProgress.currentValue, 0.01) // 3 days * 2 hours = 6 hours
    }

    // =========================================================================
    // SCENARIO D: LONG-TERM 90 DAYS GOAL (180 hours total, 25%, 50%, 75%, 100%)
    // =========================================================================

    @Test
    fun testScenarioD_longTerm90DaysCodingGoal() = runBlocking {
        val goal = Goal(
            id = 101,
            title = "90 Days Coding",
            startDate = "2026-01-01",
            endDate = "2026-03-31",
            targetValue = 180.0,
            unit = "hours"
        )
        val routine = Routine(
            id = 201,
            name = "Coding",
            startDate = "2026-01-01",
            linkedGoalId = 101,
            targetValue = 2.0,
            unit = "hours",
            taskType = TaskType.DURATION
        )

        val milestones = listOf(
            GoalMilestone(id = 1, goalId = 101, targetPercentage = 25, targetValue = 45.0, title = "25%"),
            GoalMilestone(id = 2, goalId = 101, targetPercentage = 50, targetValue = 90.0, title = "50%"),
            GoalMilestone(id = 3, goalId = 101, targetPercentage = 75, targetValue = 135.0, title = "75%"),
            GoalMilestone(id = 4, goalId = 101, targetPercentage = 100, targetValue = 180.0, title = "100%")
        )

        // Test 0 hours = 0%
        var logs = emptyList<RoutineLog>()
        var res = ProgressCalculationEngine.calculateGoalProgress(goal, listOf(routine), logs, milestones)
        assertEquals(0.0, res.currentValue, 0.01)
        assertEquals(0.0, res.percentage, 0.01)

        // Test 45 hours = 25%
        logs = listOf(RoutineLog(routineId = 201, date = "2026-01-01", actualValue = 45.0, status = LogStatus.COMPLETED))
        res = ProgressCalculationEngine.calculateGoalProgress(goal, listOf(routine), logs, milestones)
        assertEquals(45.0, res.currentValue, 0.01)
        assertEquals(25.0, res.percentage, 0.01)

        // Test 90 hours = 50%
        logs = listOf(RoutineLog(routineId = 201, date = "2026-01-01", actualValue = 90.0, status = LogStatus.COMPLETED))
        res = ProgressCalculationEngine.calculateGoalProgress(goal, listOf(routine), logs, milestones)
        assertEquals(90.0, res.currentValue, 0.01)
        assertEquals(50.0, res.percentage, 0.01)

        // Test 135 hours = 75%
        logs = listOf(RoutineLog(routineId = 201, date = "2026-01-01", actualValue = 135.0, status = LogStatus.COMPLETED))
        res = ProgressCalculationEngine.calculateGoalProgress(goal, listOf(routine), logs, milestones)
        assertEquals(135.0, res.currentValue, 0.01)
        assertEquals(75.0, res.percentage, 0.01)

        // Test 180 hours = 100%
        logs = listOf(RoutineLog(routineId = 201, date = "2026-01-01", actualValue = 180.0, status = LogStatus.COMPLETED))
        res = ProgressCalculationEngine.calculateGoalProgress(goal, listOf(routine), logs, milestones)
        assertEquals(180.0, res.currentValue, 0.01)
        assertEquals(100.0, res.percentage, 0.01)
        assertTrue(res.isCompleted)

        // Milestone persistence prevents duplicate celebration
        assertFalse(repository.hasCelebratedGoal(101))
        repository.markCelebratedGoal(101)
        assertTrue(repository.hasCelebratedGoal(101))
    }
}
