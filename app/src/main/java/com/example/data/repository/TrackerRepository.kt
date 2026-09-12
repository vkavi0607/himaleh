package com.example.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.data.db.AppDatabase
import com.example.data.model.*
import com.example.domain.ProgressCalculationEngine
import com.example.notification.ReminderScheduler
import com.example.widget.ConsistencyAppWidgetProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

class TrackerRepository(private val context: Context) {

    private val db = AppDatabase.getInstance(context)
    private val goalDao = db.goalDao()
    private val routineDao = db.routineDao()
    private val logDao = db.routineLogDao()
    private val reflectionDao = db.dailyReflectionDao()

    private val prefs: SharedPreferences =
        context.getSharedPreferences("user_settings_prefs", Context.MODE_PRIVATE)

    private val _settingsFlow = MutableStateFlow(loadSettings())
    val settingsFlow: StateFlow<UserSettings> = _settingsFlow.asStateFlow()

    val allGoals: Flow<List<Goal>> = goalDao.getAllGoalsFlow()
    val allMilestones: Flow<List<GoalMilestone>> = goalDao.getAllMilestonesFlow()
    val allRoutines: Flow<List<Routine>> = routineDao.getAllRoutinesFlow()
    val allLogs: Flow<List<RoutineLog>> = logDao.getAllLogsFlow()
    val allReflections: Flow<List<DailyReflection>> = reflectionDao.getAllReflectionsFlow()

    init {
        ReminderScheduler.createNotificationChannels(context)
    }

    private fun loadSettings(): UserSettings {
        return UserSettings(
            themeMode = prefs.getString("theme_mode", "SYSTEM") ?: "SYSTEM",
            is24HourFormat = prefs.getBoolean("is_24h", false),
            startDayOfWeek = prefs.getInt("start_dow", 1),
            remindersEnabled = prefs.getBoolean("reminders_enabled", true),
            eveningReminderEnabled = prefs.getBoolean("evening_reminder", true),
            eveningReminderTime = prefs.getString("evening_time", "20:00") ?: "20:00"
        )
    }

    fun updateSettings(settings: UserSettings) {
        prefs.edit()
            .putString("theme_mode", settings.themeMode)
            .putBoolean("is_24h", settings.is24HourFormat)
            .putInt("start_dow", settings.startDayOfWeek)
            .putBoolean("reminders_enabled", settings.remindersEnabled)
            .putBoolean("evening_reminder", settings.eveningReminderEnabled)
            .putString("evening_time", settings.eveningReminderTime)
            .apply()
        _settingsFlow.value = settings
    }

    // --- Goal Operations ---

    suspend fun insertGoal(goal: Goal, createDefaultMilestones: Boolean = true): Long {
        val goalId = goalDao.insertGoal(goal)
        if (createDefaultMilestones && goal.targetValue > 0) {
            val milestones = listOf(
                GoalMilestone(goalId = goalId, targetPercentage = 25, targetValue = goal.targetValue * 0.25, title = "25% Milestone"),
                GoalMilestone(goalId = goalId, targetPercentage = 50, targetValue = goal.targetValue * 0.50, title = "Halfway There (50%)"),
                GoalMilestone(goalId = goalId, targetPercentage = 75, targetValue = goal.targetValue * 0.75, title = "75% Master"),
                GoalMilestone(goalId = goalId, targetPercentage = 100, targetValue = goal.targetValue, title = "Goal Achieved (100%)")
            )
            goalDao.insertMilestones(milestones)
        }
        return goalId
    }

    suspend fun updateGoal(goal: Goal) {
        goalDao.updateGoal(goal)
    }

    suspend fun deleteGoal(goal: Goal) {
        goalDao.deleteMilestonesForGoal(goal.id)
        goalDao.deleteGoal(goal)
    }

    suspend fun setGoalStatus(goalId: Long, status: GoalStatus) {
        val goal = goalDao.getGoalById(goalId) ?: return
        goalDao.updateGoal(goal.copy(status = status))
    }

    suspend fun updateMilestone(milestone: GoalMilestone) {
        goalDao.updateMilestone(milestone)
    }

    // --- Routine Operations ---

    suspend fun insertRoutine(routine: Routine): Long {
        val id = routineDao.insertRoutine(routine)
        val created = routine.copy(id = id)
        if (created.reminderEnabled && !created.isPaused) {
            ReminderScheduler.scheduleRoutineReminder(context, created)
        }
        ConsistencyAppWidgetProvider.updateAllWidgets(context)
        return id
    }

    suspend fun updateRoutine(routine: Routine) {
        routineDao.updateRoutine(routine)
        if (routine.reminderEnabled && !routine.isPaused) {
            ReminderScheduler.scheduleRoutineReminder(context, routine)
        } else {
            ReminderScheduler.cancelRoutineReminder(context, routine.id)
        }
        ConsistencyAppWidgetProvider.updateAllWidgets(context)
    }

    suspend fun deleteRoutine(routine: Routine) {
        ReminderScheduler.cancelRoutineReminder(context, routine.id)
        logDao.deleteLogsForRoutine(routine.id)
        routineDao.deleteRoutine(routine)
        ConsistencyAppWidgetProvider.updateAllWidgets(context)
    }

    suspend fun setRoutinePaused(routineId: Long, isPaused: Boolean) {
        val routine = routineDao.getRoutineById(routineId) ?: return
        val updated = routine.copy(isPaused = isPaused)
        updateRoutine(updated)
    }

    suspend fun duplicateRoutine(routineId: Long) {
        val original = routineDao.getRoutineById(routineId) ?: return
        val copy = original.copy(
            id = 0,
            name = "${original.name} (Copy)",
            createdAt = System.currentTimeMillis()
        )
        insertRoutine(copy)
    }

    // --- Log / Tracking Operations ---

    suspend fun completeRoutine(
        routineId: Long,
        date: String,
        actualValue: Double = 1.0,
        notes: String = ""
    ): Boolean {
        return try {
            val log = RoutineLog(
                routineId = routineId,
                date = date,
                status = LogStatus.COMPLETED,
                actualValue = actualValue,
                completedAtTimestamp = System.currentTimeMillis(),
                notes = notes
            )
            logDao.insertOrUpdateLog(log)
            ConsistencyAppWidgetProvider.updateAllWidgets(context)
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun undoRoutineCompletion(routineId: Long, date: String): Boolean {
        return try {
            logDao.deleteLogForRoutineAndDate(routineId, date)
            ConsistencyAppWidgetProvider.updateAllWidgets(context)
            true
        } catch (e: Exception) {
            false
        }
    }

    // --- Celebration Tracking Persistence ---

    fun hasCelebratedDaily(date: String): Boolean {
        val set = prefs.getStringSet("celebrated_daily_dates", emptySet()) ?: emptySet()
        return set.contains(date)
    }

    fun markCelebratedDaily(date: String) {
        val current = prefs.getStringSet("celebrated_daily_dates", emptySet()) ?: emptySet()
        val set = HashSet(current)
        set.add(date)
        prefs.edit().putStringSet("celebrated_daily_dates", set).apply()
    }

    fun hasCelebratedWeekly(weekKey: String): Boolean {
        val set = prefs.getStringSet("celebrated_weeks", emptySet()) ?: emptySet()
        return set.contains(weekKey)
    }

    fun markCelebratedWeekly(weekKey: String) {
        val current = prefs.getStringSet("celebrated_weeks", emptySet()) ?: emptySet()
        val set = HashSet(current)
        set.add(weekKey)
        prefs.edit().putStringSet("celebrated_weeks", set).apply()
    }

    fun hasCelebratedGoal(goalId: Long): Boolean {
        val set = prefs.getStringSet("celebrated_goals", emptySet()) ?: emptySet()
        return set.contains(goalId.toString())
    }

    fun markCelebratedGoal(goalId: Long) {
        val current = prefs.getStringSet("celebrated_goals", emptySet()) ?: emptySet()
        val set = HashSet(current)
        set.add(goalId.toString())
        prefs.edit().putStringSet("celebrated_goals", set).apply()
    }

    suspend fun skipRoutine(routineId: Long, date: String, notes: String = "") {
        val log = RoutineLog(
            routineId = routineId,
            date = date,
            status = LogStatus.SKIPPED,
            actualValue = 0.0,
            completedAtTimestamp = System.currentTimeMillis(),
            notes = notes
        )
        logDao.insertOrUpdateLog(log)
        ConsistencyAppWidgetProvider.updateAllWidgets(context)
    }

    suspend fun rescheduleRoutine(routineId: Long, fromDate: String, toDate: String) {
        val log = RoutineLog(
            routineId = routineId,
            date = fromDate,
            status = LogStatus.RESCHEDULED,
            actualValue = 0.0,
            rescheduledToDate = toDate,
            completedAtTimestamp = System.currentTimeMillis()
        )
        logDao.insertOrUpdateLog(log)
        ConsistencyAppWidgetProvider.updateAllWidgets(context)
    }

    // --- Reflections ---

    fun getReflectionFlow(date: String): Flow<DailyReflection?> = reflectionDao.getReflectionFlow(date)

    suspend fun saveReflection(reflection: DailyReflection) {
        reflectionDao.insertOrUpdateReflection(reflection)
    }

    // --- Data Export / Import & Reset ---

    suspend fun exportDataAsJson(): String {
        val root = JSONObject()
        root.put("version", 1)
        root.put("exportedAt", System.currentTimeMillis())

        val goalsList = goalDao.getAllGoals()
        val goalsArray = JSONArray()
        for (g in goalsList) {
            val obj = JSONObject().apply {
                put("id", g.id)
                put("title", g.title)
                put("description", g.description)
                put("category", g.category)
                put("startDate", g.startDate)
                put("endDate", g.endDate)
                put("priority", g.priority.name)
                put("targetValue", g.targetValue)
                put("unit", g.unit)
                put("motivation", g.motivation)
                put("status", g.status.name)
                put("createdAt", g.createdAt)
            }
            goalsArray.put(obj)
        }
        root.put("goals", goalsArray)

        val milestonesList = goalDao.getAllMilestones()
        val milestonesArray = JSONArray()
        for (m in milestonesList) {
            val obj = JSONObject().apply {
                put("id", m.id)
                put("goalId", m.goalId)
                put("targetPercentage", m.targetPercentage)
                put("targetValue", m.targetValue)
                put("title", m.title)
                put("achievedAt", m.achievedAt ?: JSONObject.NULL)
            }
            milestonesArray.put(obj)
        }
        root.put("milestones", milestonesArray)

        val routinesList = routineDao.getAllRoutines()
        val routinesArray = JSONArray()
        for (r in routinesList) {
            val obj = JSONObject().apply {
                put("id", r.id)
                put("name", r.name)
                put("description", r.description)
                put("category", r.category)
                put("linkedGoalId", r.linkedGoalId ?: JSONObject.NULL)
                put("startDate", r.startDate)
                put("endDate", r.endDate ?: JSONObject.NULL)
                put("timeHour", r.timeHour)
                put("timeMinute", r.timeMinute)
                put("durationMinutes", r.durationMinutes)
                put("frequency", r.frequency.name)
                put("frequencyDays", r.frequencyDays)
                put("weeklyTargetTimes", r.weeklyTargetTimes)
                put("taskType", r.taskType.name)
                put("targetValue", r.targetValue)
                put("unit", r.unit)
                put("priority", r.priority.name)
                put("reminderEnabled", r.reminderEnabled)
                put("isPaused", r.isPaused)
                put("createdAt", r.createdAt)
            }
            routinesArray.put(obj)
        }
        root.put("routines", routinesArray)

        val logsList = logDao.getAllLogs()
        val logsArray = JSONArray()
        for (l in logsList) {
            val obj = JSONObject().apply {
                put("id", l.id)
                put("routineId", l.routineId)
                put("date", l.date)
                put("status", l.status.name)
                put("actualValue", l.actualValue)
                put("rescheduledToDate", l.rescheduledToDate ?: JSONObject.NULL)
                put("completedAtTimestamp", l.completedAtTimestamp)
                put("notes", l.notes)
            }
            logsArray.put(obj)
        }
        root.put("logs", logsArray)

        val reflectionsList = reflectionDao.getAllReflections()
        val reflectionsArray = JSONArray()
        for (ref in reflectionsList) {
            val obj = JSONObject().apply {
                put("date", ref.date)
                put("rating", ref.rating)
                put("wentWell", ref.wentWell)
                put("couldImprove", ref.couldImprove)
                put("notes", ref.notes)
                put("updatedAt", ref.updatedAt)
            }
            reflectionsArray.put(obj)
        }
        root.put("reflections", reflectionsArray)

        return root.toString(2)
    }

    suspend fun importDataFromJson(jsonString: String): Result<Int> {
        return try {
            val root = JSONObject(jsonString)
            var count = 0

            // Import goals
            if (root.has("goals")) {
                val array = root.getJSONArray("goals")
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val goal = Goal(
                        id = obj.optLong("id", 0),
                        title = obj.getString("title"),
                        description = obj.optString("description", ""),
                        category = obj.optString("category", "Personal"),
                        startDate = obj.getString("startDate"),
                        endDate = obj.getString("endDate"),
                        priority = try { GoalPriority.valueOf(obj.optString("priority", "MEDIUM")) } catch (e: Exception) { GoalPriority.MEDIUM },
                        targetValue = obj.optDouble("targetValue", 100.0),
                        unit = obj.optString("unit", "%"),
                        motivation = obj.optString("motivation", ""),
                        status = try { GoalStatus.valueOf(obj.optString("status", "ACTIVE")) } catch (e: Exception) { GoalStatus.ACTIVE },
                        createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                    )
                    goalDao.insertGoal(goal)
                    count++
                }
            }

            // Import milestones
            if (root.has("milestones")) {
                val array = root.getJSONArray("milestones")
                val milestones = mutableListOf<GoalMilestone>()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val milestone = GoalMilestone(
                        id = obj.optLong("id", 0),
                        goalId = obj.getLong("goalId"),
                        targetPercentage = obj.getInt("targetPercentage"),
                        targetValue = obj.optDouble("targetValue", 0.0),
                        title = obj.getString("title"),
                        achievedAt = if (obj.isNull("achievedAt")) null else obj.optLong("achievedAt")
                    )
                    milestones.add(milestone)
                }
                if (milestones.isNotEmpty()) {
                    goalDao.insertMilestones(milestones)
                }
            }

            // Import routines
            if (root.has("routines")) {
                val array = root.getJSONArray("routines")
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val routine = Routine(
                        id = obj.optLong("id", 0),
                        name = obj.getString("name"),
                        description = obj.optString("description", ""),
                        category = obj.optString("category", "Personal"),
                        linkedGoalId = if (obj.isNull("linkedGoalId")) null else obj.optLong("linkedGoalId"),
                        startDate = obj.getString("startDate"),
                        endDate = if (obj.isNull("endDate")) null else obj.optString("endDate"),
                        timeHour = obj.optInt("timeHour", 9),
                        timeMinute = obj.optInt("timeMinute", 0),
                        durationMinutes = obj.optInt("durationMinutes", 30),
                        frequency = try { RoutineFrequency.valueOf(obj.optString("frequency", "DAILY")) } catch (e: Exception) { RoutineFrequency.DAILY },
                        frequencyDays = obj.optString("frequencyDays", "1,2,3,4,5,6,7"),
                        weeklyTargetTimes = obj.optInt("weeklyTargetTimes", 3),
                        taskType = try { TaskType.valueOf(obj.optString("taskType", "CHECKBOX")) } catch (e: Exception) { TaskType.CHECKBOX },
                        targetValue = obj.optDouble("targetValue", 1.0),
                        unit = obj.optString("unit", ""),
                        priority = try { RoutinePriority.valueOf(obj.optString("priority", "MEDIUM")) } catch (e: Exception) { RoutinePriority.MEDIUM },
                        reminderEnabled = obj.optBoolean("reminderEnabled", true),
                        isPaused = obj.optBoolean("isPaused", false),
                        createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                    )
                    routineDao.insertRoutine(routine)
                    if (routine.reminderEnabled && !routine.isPaused) {
                        ReminderScheduler.scheduleRoutineReminder(context, routine)
                    }
                    count++
                }
            }

            // Import logs
            if (root.has("logs")) {
                val array = root.getJSONArray("logs")
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val log = RoutineLog(
                        id = obj.optLong("id", 0),
                        routineId = obj.getLong("routineId"),
                        date = obj.getString("date"),
                        status = try { LogStatus.valueOf(obj.optString("status", "COMPLETED")) } catch (e: Exception) { LogStatus.COMPLETED },
                        actualValue = obj.optDouble("actualValue", 1.0),
                        rescheduledToDate = if (obj.isNull("rescheduledToDate")) null else obj.optString("rescheduledToDate"),
                        completedAtTimestamp = obj.optLong("completedAtTimestamp", System.currentTimeMillis()),
                        notes = obj.optString("notes", "")
                    )
                    logDao.insertOrUpdateLog(log)
                    count++
                }
            }

            // Import reflections
            if (root.has("reflections")) {
                val array = root.getJSONArray("reflections")
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val ref = DailyReflection(
                        date = obj.getString("date"),
                        rating = obj.optInt("rating", 5),
                        wentWell = obj.optString("wentWell", ""),
                        couldImprove = obj.optString("couldImprove", ""),
                        notes = obj.optString("notes", ""),
                        updatedAt = obj.optLong("updatedAt", System.currentTimeMillis())
                    )
                    reflectionDao.insertOrUpdateReflection(ref)
                    count++
                }
            }

            ConsistencyAppWidgetProvider.updateAllWidgets(context)
            Result.success(count)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetAllData() {
        // Cancel all alarms
        val routines = routineDao.getAllRoutines()
        for (r in routines) {
            ReminderScheduler.cancelRoutineReminder(context, r.id)
        }

        goalDao.deleteAllMilestones()
        goalDao.deleteAllGoals()
        routineDao.deleteAllRoutines()
        logDao.deleteAllLogs()
        reflectionDao.deleteAllReflections()

        prefs.edit().clear().apply()
        _settingsFlow.value = loadSettings()

        ConsistencyAppWidgetProvider.updateAllWidgets(context)
    }
}
