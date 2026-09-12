package com.example.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class LogStatus {
    COMPLETED,
    SKIPPED,
    RESCHEDULED
}

@Entity(
    tableName = "routine_logs",
    indices = [
        Index(value = ["routineId", "date"], unique = true)
    ]
)
data class RoutineLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val routineId: Long,
    val date: String, // YYYY-MM-DD
    val status: LogStatus = LogStatus.COMPLETED,
    val actualValue: Double = 1.0,
    val rescheduledToDate: String? = null,
    val completedAtTimestamp: Long = System.currentTimeMillis(),
    val notes: String = ""
)
