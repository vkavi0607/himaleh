package com.example

import com.example.data.model.*
import com.example.domain.ConsistencyEngine
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class ConsistencyEngineTest {

    @Test
    fun testCalculateStreaks_consecutiveDays() {
        val routine = Routine(id = 1, name = "Daily Exercise", startDate = "2026-01-01")
        val today = LocalDate.parse("2026-01-04")

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
        assertEquals(4, stats.longestStreak)
        assertEquals(4, stats.totalCompletedDays)
        assertEquals(100.0, stats.weeklyConsistency, 0.01)
    }

    @Test
    fun testCalculateStreaks_restDayDoesNotBreakStreak() {
        // Weekdays only routine (Saturday 2026-01-03 and Sunday 2026-01-04 are rest days)
        val routine = Routine(
            id = 1,
            name = "Weekday Study",
            startDate = "2026-01-01",
            frequency = RoutineFrequency.WEEKDAYS
        )
        // Friday
        val friday = "2026-01-02"
        // Sunday
        val sunday = LocalDate.parse("2026-01-04")

        val logs = listOf(
            RoutineLog(routineId = 1, date = "2026-01-01", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = friday, status = LogStatus.COMPLETED)
        )

        val stats = ConsistencyEngine.calculateStreaks(
            routines = listOf(routine),
            allLogs = logs,
            today = sunday
        )

        // Weekend rest days preserve the 2-day weekday streak!
        assertEquals(2, stats.currentStreak)
    }

    @Test
    fun testCalculateStreaks_missedDayBreaksStreak() {
        val routine = Routine(id = 1, name = "Daily Reading", startDate = "2026-01-01")
        val today = LocalDate.parse("2026-01-05")

        val logs = listOf(
            RoutineLog(routineId = 1, date = "2026-01-01", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = "2026-01-02", status = LogStatus.COMPLETED),
            // 2026-01-03 was missed!
            RoutineLog(routineId = 1, date = "2026-01-04", status = LogStatus.COMPLETED),
            RoutineLog(routineId = 1, date = "2026-01-05", status = LogStatus.COMPLETED)
        )

        val stats = ConsistencyEngine.calculateStreaks(
            routines = listOf(routine),
            allLogs = logs,
            today = today
        )

        // 2026-01-04 and 2026-01-05 are the new active streak of 2 days
        assertEquals(2, stats.currentStreak)
        assertEquals(2, stats.longestStreak)
    }
}
