package com.example.data.db

import androidx.room.*
import com.example.data.model.RoutineLog
import kotlinx.coroutines.flow.Flow

@Dao
interface RoutineLogDao {
    @Query("SELECT * FROM routine_logs ORDER BY date DESC")
    fun getAllLogsFlow(): Flow<List<RoutineLog>>

    @Query("SELECT * FROM routine_logs ORDER BY date DESC")
    suspend fun getAllLogs(): List<RoutineLog>

    @Query("SELECT * FROM routine_logs WHERE date = :date")
    fun getLogsForDateFlow(date: String): Flow<List<RoutineLog>>

    @Query("SELECT * FROM routine_logs WHERE date = :date")
    suspend fun getLogsForDate(date: String): List<RoutineLog>

    @Query("SELECT * FROM routine_logs WHERE routineId = :routineId")
    suspend fun getLogsForRoutine(routineId: Long): List<RoutineLog>

    @Query("SELECT * FROM routine_logs WHERE routineId = :routineId AND date = :date LIMIT 1")
    suspend fun getLog(routineId: Long, date: String): RoutineLog?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateLog(log: RoutineLog): Long

    @Delete
    suspend fun deleteLog(log: RoutineLog)

    @Query("DELETE FROM routine_logs WHERE routineId = :routineId AND date = :date")
    suspend fun deleteLogForRoutineAndDate(routineId: Long, date: String)

    @Query("DELETE FROM routine_logs WHERE routineId = :routineId")
    suspend fun deleteLogsForRoutine(routineId: Long)

    @Query("DELETE FROM routine_logs")
    suspend fun deleteAllLogs()
}
