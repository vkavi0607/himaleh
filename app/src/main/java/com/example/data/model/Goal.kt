package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class GoalPriority {
    LOW, MEDIUM, HIGH
}

enum class GoalStatus {
    ACTIVE, PAUSED, COMPLETED, EXPIRED, ARCHIVED
}

@Entity(tableName = "goals")
data class Goal(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String = "",
    val category: String = "Personal",
    val startDate: String, // YYYY-MM-DD
    val endDate: String,   // YYYY-MM-DD
    val priority: GoalPriority = GoalPriority.MEDIUM,
    val targetValue: Double = 100.0,
    val unit: String = "%", // e.g. Hours, Pages, Km, Reps, Days, %
    val motivation: String = "",
    val status: GoalStatus = GoalStatus.ACTIVE,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "goal_milestones")
data class GoalMilestone(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val goalId: Long,
    val targetPercentage: Int, // 25, 50, 75, 100
    val targetValue: Double,
    val title: String,
    val achievedAt: Long? = null // null until achieved
)
