package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class RoutineFrequency {
    DAILY,
    WEEKDAYS,       // Monday - Friday
    WEEKLY_X_TIMES, // X times per week
    CUSTOM_DAYS     // Specific selected days of week
}

enum class TaskType {
    CHECKBOX,   // ☐ -> ☑
    DURATION,   // e.g. 60 minutes
    QUANTITY,   // e.g. 2.5 Liters
    COUNT,      // e.g. 50 Push-ups
    TIME_BASED  // Check-in at specific time
}

enum class RoutinePriority {
    LOW, MEDIUM, HIGH
}

@Entity(tableName = "routines")
data class Routine(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val description: String = "",
    val category: String = "Personal",
    val linkedGoalId: Long? = null,
    val startDate: String, // YYYY-MM-DD
    val endDate: String? = null, // YYYY-MM-DD or null for indefinite
    val timeHour: Int = 9,
    val timeMinute: Int = 0,
    val durationMinutes: Int = 30,
    val frequency: RoutineFrequency = RoutineFrequency.DAILY,
    val frequencyDays: String = "1,2,3,4,5,6,7", // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    val weeklyTargetTimes: Int = 3,
    val taskType: TaskType = TaskType.CHECKBOX,
    val targetValue: Double = 1.0,
    val unit: String = "",
    val priority: RoutinePriority = RoutinePriority.MEDIUM,
    val reminderEnabled: Boolean = true,
    val isPaused: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
