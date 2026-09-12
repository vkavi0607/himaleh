package com.example.data.db

import androidx.room.*
import com.example.data.model.DailyReflection
import kotlinx.coroutines.flow.Flow

@Dao
interface DailyReflectionDao {
    @Query("SELECT * FROM daily_reflections WHERE date = :date LIMIT 1")
    fun getReflectionFlow(date: String): Flow<DailyReflection?>

    @Query("SELECT * FROM daily_reflections WHERE date = :date LIMIT 1")
    suspend fun getReflection(date: String): DailyReflection?

    @Query("SELECT * FROM daily_reflections ORDER BY date DESC")
    fun getAllReflectionsFlow(): Flow<List<DailyReflection>>

    @Query("SELECT * FROM daily_reflections ORDER BY date DESC")
    suspend fun getAllReflections(): List<DailyReflection>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateReflection(reflection: DailyReflection)

    @Query("DELETE FROM daily_reflections WHERE date = :date")
    suspend fun deleteReflection(date: String)

    @Query("DELETE FROM daily_reflections")
    suspend fun deleteAllReflections()
}
