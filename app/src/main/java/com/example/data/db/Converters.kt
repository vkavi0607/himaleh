package com.example.data.db

import androidx.room.TypeConverter
import com.example.data.model.*

class Converters {
    @TypeConverter
    fun fromGoalPriority(value: GoalPriority): String = value.name

    @TypeConverter
    fun toGoalPriority(value: String): GoalPriority = try {
        GoalPriority.valueOf(value)
    } catch (e: Exception) {
        GoalPriority.MEDIUM
    }

    @TypeConverter
    fun fromGoalStatus(value: GoalStatus): String = value.name

    @TypeConverter
    fun toGoalStatus(value: String): GoalStatus = try {
        GoalStatus.valueOf(value)
    } catch (e: Exception) {
        GoalStatus.ACTIVE
    }

    @TypeConverter
    fun fromRoutineFrequency(value: RoutineFrequency): String = value.name

    @TypeConverter
    fun toRoutineFrequency(value: String): RoutineFrequency = try {
        RoutineFrequency.valueOf(value)
    } catch (e: Exception) {
        RoutineFrequency.DAILY
    }

    @TypeConverter
    fun fromTaskType(value: TaskType): String = value.name

    @TypeConverter
    fun toTaskType(value: String): TaskType = try {
        TaskType.valueOf(value)
    } catch (e: Exception) {
        TaskType.CHECKBOX
    }

    @TypeConverter
    fun fromRoutinePriority(value: RoutinePriority): String = value.name

    @TypeConverter
    fun toRoutinePriority(value: String): RoutinePriority = try {
        RoutinePriority.valueOf(value)
    } catch (e: Exception) {
        RoutinePriority.MEDIUM
    }

    @TypeConverter
    fun fromLogStatus(value: LogStatus): String = value.name

    @TypeConverter
    fun toLogStatus(value: String): LogStatus = try {
        LogStatus.valueOf(value)
    } catch (e: Exception) {
        LogStatus.COMPLETED
    }
}
