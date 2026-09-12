package com.example.data.db

import androidx.room.*
import com.example.data.model.Routine
import kotlinx.coroutines.flow.Flow

@Dao
interface RoutineDao {
    @Query("SELECT * FROM routines ORDER BY timeHour ASC, timeMinute ASC")
    fun getAllRoutinesFlow(): Flow<List<Routine>>

    @Query("SELECT * FROM routines ORDER BY timeHour ASC, timeMinute ASC")
    suspend fun getAllRoutines(): List<Routine>

    @Query("SELECT * FROM routines WHERE id = :id LIMIT 1")
    suspend fun getRoutineById(id: Long): Routine?

    @Query("SELECT * FROM routines WHERE linkedGoalId = :goalId")
    suspend fun getRoutinesForGoal(goalId: Long): List<Routine>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoutine(routine: Routine): Long

    @Update
    suspend fun updateRoutine(routine: Routine)

    @Delete
    suspend fun deleteRoutine(routine: Routine)

    @Query("DELETE FROM routines")
    suspend fun deleteAllRoutines()
}
