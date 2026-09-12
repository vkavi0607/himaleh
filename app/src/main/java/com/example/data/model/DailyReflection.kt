package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "daily_reflections")
data class DailyReflection(
    @PrimaryKey val date: String, // YYYY-MM-DD
    val rating: Int = 5, // 1 to 5
    val wentWell: String = "",
    val couldImprove: String = "",
    val notes: String = "",
    val updatedAt: Long = System.currentTimeMillis()
)
