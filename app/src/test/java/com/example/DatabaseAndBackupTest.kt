package com.example

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.db.AppDatabase
import com.example.data.model.*
import com.example.data.repository.TrackerRepository
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class DatabaseAndBackupTest {

    private lateinit var db: AppDatabase
    private lateinit var context: Context

    @Before
    fun setup() {
        context = ApplicationProvider.getApplicationContext()
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
    }

    @After
    fun tearDown() {
        db.close()
    }

    @Test
    fun testGoalAndMilestonePersistence() = runBlocking {
        val goalDao = db.goalDao()
        val goal = Goal(
            title = "Fitness Goal",
            description = "Run 50km",
            category = "Fitness",
            startDate = "2026-01-01",
            endDate = "2026-06-01",
            targetValue = 50.0,
            unit = "km"
        )
        val goalId = goalDao.insertGoal(goal)
        assertTrue(goalId > 0)

        val retrieved = goalDao.getGoalById(goalId)
        assertNotNull(retrieved)
        assertEquals("Fitness Goal", retrieved?.title)
        assertEquals(50.0, retrieved?.targetValue ?: 0.0, 0.01)

        val milestone = GoalMilestone(
            goalId = goalId,
            targetPercentage = 50,
            targetValue = 25.0,
            title = "Halfway"
        )
        goalDao.insertMilestones(listOf(milestone))

        val milestones = goalDao.getMilestonesForGoal(goalId)
        assertEquals(1, milestones.size)
        assertEquals("Halfway", milestones[0].title)
    }

    @Test
    fun testRoutineAndLogPersistence() = runBlocking {
        val routineDao = db.routineDao()
        val logDao = db.routineLogDao()

        val routine = Routine(
            name = "Morning Pushups",
            category = "Fitness",
            startDate = "2026-01-01",
            taskType = TaskType.COUNT,
            targetValue = 50.0,
            unit = "reps"
        )
        val routineId = routineDao.insertRoutine(routine)
        assertTrue(routineId > 0)

        val log = RoutineLog(
            routineId = routineId,
            date = "2026-01-15",
            status = LogStatus.COMPLETED,
            actualValue = 50.0
        )
        logDao.insertOrUpdateLog(log)

        val retrievedLog = logDao.getLog(routineId, "2026-01-15")
        assertNotNull(retrievedLog)
        assertEquals(LogStatus.COMPLETED, retrievedLog?.status)
        assertEquals(50.0, retrievedLog?.actualValue ?: 0.0, 0.01)
    }

    @Test
    fun testReflectionPersistence() = runBlocking {
        val reflectionDao = db.dailyReflectionDao()
        val reflection = DailyReflection(
            date = "2026-01-15",
            rating = 5,
            wentWell = "Finished all routines early",
            couldImprove = "Go to sleep earlier",
            notes = "Great energy"
        )
        reflectionDao.insertOrUpdateReflection(reflection)

        val retrieved = reflectionDao.getReflection("2026-01-15")
        assertNotNull(retrieved)
        assertEquals(5, retrieved?.rating)
        assertEquals("Finished all routines early", retrieved?.wentWell)
    }

    @Test
    fun testRepositoryExportAndImport() = runBlocking {
        val repo = TrackerRepository(context)

        // Insert goal and routine
        val gId = repo.insertGoal(
            Goal(title = "Learn Kotlin", startDate = "2026-01-01", endDate = "2026-12-31"),
            createDefaultMilestones = true
        )
        val rId = repo.insertRoutine(
            Routine(name = "Daily Coding", startDate = "2026-01-01", linkedGoalId = gId)
        )
        repo.completeRoutine(rId, "2026-01-05")

        // Export to JSON
        val exportedJson = repo.exportDataAsJson()
        assertTrue(exportedJson.contains("Learn Kotlin"))
        assertTrue(exportedJson.contains("Daily Coding"))

        // Reset
        repo.resetAllData()

        // Import back from JSON
        val importResult = repo.importDataFromJson(exportedJson)
        assertTrue(importResult.isSuccess)
        assertTrue(importResult.getOrNull() ?: 0 > 0)
    }
}
