package com.example.data.db

import androidx.room.*
import com.example.data.model.Goal
import com.example.data.model.GoalMilestone
import kotlinx.coroutines.flow.Flow

@Dao
interface GoalDao {
    @Query("SELECT * FROM goals ORDER BY createdAt DESC")
    fun getAllGoalsFlow(): Flow<List<Goal>>

    @Query("SELECT * FROM goals ORDER BY createdAt DESC")
    suspend fun getAllGoals(): List<Goal>

    @Query("SELECT * FROM goals WHERE id = :id LIMIT 1")
    suspend fun getGoalById(id: Long): Goal?

    @Query("SELECT * FROM goal_milestones WHERE goalId = :goalId ORDER BY targetPercentage ASC")
    fun getMilestonesForGoalFlow(goalId: Long): Flow<List<GoalMilestone>>

    @Query("SELECT * FROM goal_milestones WHERE goalId = :goalId ORDER BY targetPercentage ASC")
    suspend fun getMilestonesForGoal(goalId: Long): List<GoalMilestone>

    @Query("SELECT * FROM goal_milestones ORDER BY targetPercentage ASC")
    fun getAllMilestonesFlow(): Flow<List<GoalMilestone>>

    @Query("SELECT * FROM goal_milestones ORDER BY targetPercentage ASC")
    suspend fun getAllMilestones(): List<GoalMilestone>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: Goal): Long

    @Update
    suspend fun updateGoal(goal: Goal)

    @Delete
    suspend fun deleteGoal(goal: Goal)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMilestones(milestones: List<GoalMilestone>)

    @Update
    suspend fun updateMilestone(milestone: GoalMilestone)

    @Query("DELETE FROM goal_milestones WHERE goalId = :goalId")
    suspend fun deleteMilestonesForGoal(goalId: Long)

    @Query("DELETE FROM goals")
    suspend fun deleteAllGoals()

    @Query("DELETE FROM goal_milestones")
    suspend fun deleteAllMilestones()
}
