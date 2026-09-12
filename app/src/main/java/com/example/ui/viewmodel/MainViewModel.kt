package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.TrackerRepository
import com.example.domain.*
import com.example.ui.components.CelebrationEvent
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate

data class MainUiState(
    val selectedDate: LocalDate = LocalDate.now(),
    val goals: List<Goal> = emptyList(),
    val milestones: List<GoalMilestone> = emptyList(),
    val routines: List<Routine> = emptyList(),
    val allLogs: List<RoutineLog> = emptyList(),
    val selectedDateProgress: DailyProgressResult? = null,
    val todayProgress: DailyProgressResult? = null,
    val streakStats: StreakStats = StreakStats(0, 0),
    val goalProgressList: List<GoalProgressResult> = emptyList(),
    val missedInsights: List<MissedInsight> = emptyList(),
    val selectedDateReflection: DailyReflection? = null,
    val allReflections: List<DailyReflection> = emptyList(),
    val settings: UserSettings = UserSettings(),
    val routineSearchQuery: String = "",
    val selectedRoutineCategory: String? = null,
    val routineFilterStatus: String = "ALL", // ALL, PENDING, COMPLETED, SKIPPED
    val goalSearchQuery: String = "",
    val goalFilterStatus: String = "ALL", // ALL, ACTIVE, PAUSED, COMPLETED, ARCHIVED
    val userFeedbackMessage: String? = null
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = TrackerRepository(application)

    private val _selectedDate = MutableStateFlow(LocalDate.now())
    private val _routineSearchQuery = MutableStateFlow("")
    private val _selectedRoutineCategory = MutableStateFlow<String?>(null)
    private val _routineFilterStatus = MutableStateFlow("ALL")
    private val _goalSearchQuery = MutableStateFlow("")
    private val _goalFilterStatus = MutableStateFlow("ALL")
    private val _userFeedbackMessage = MutableStateFlow<String?>(null)

    // Active Dialog States
    val isAddRoutineDialogOpen = MutableStateFlow(false)
    val editingRoutine = MutableStateFlow<Routine?>(null)
    val isQuickAddSheetOpen = MutableStateFlow(false)

    val isAddGoalDialogOpen = MutableStateFlow(false)
    val editingGoal = MutableStateFlow<Goal?>(null)
    val viewingGoalDetails = MutableStateFlow<Goal?>(null)

    val completingRoutineForMeasurement = MutableStateFlow<Routine?>(null)
    val reschedulingRoutine = MutableStateFlow<Routine?>(null)
    val isReflectionDialogOpen = MutableStateFlow(false)

    // Routine completion animation and celebrations
    val justCompletedRoutineId = MutableStateFlow<Long?>(null)
    val activeCelebration = MutableStateFlow<CelebrationEvent?>(null)
    private val celebrationQueue = ArrayDeque<CelebrationEvent>()

    fun dismissCelebration() {
        if (celebrationQueue.isNotEmpty()) {
            activeCelebration.value = celebrationQueue.removeFirst()
        } else {
            activeCelebration.value = null
        }
    }

    fun clearJustCompletedRoutine(routineId: Long) {
        if (justCompletedRoutineId.value == routineId) {
            justCompletedRoutineId.value = null
        }
    }

    val uiState: StateFlow<MainUiState> = combine(
        _selectedDate,
        repository.allGoals,
        repository.allMilestones,
        repository.allRoutines,
        repository.allLogs,
        repository.allReflections,
        repository.settingsFlow,
        _routineSearchQuery,
        _selectedRoutineCategory,
        _routineFilterStatus,
        _goalSearchQuery,
        _goalFilterStatus,
        _userFeedbackMessage
    ) { args: Array<Any?> ->
        val selectedDate = args[0] as LocalDate
        @Suppress("UNCHECKED_CAST")
        val goals = args[1] as List<Goal>
        @Suppress("UNCHECKED_CAST")
        val milestones = args[2] as List<GoalMilestone>
        @Suppress("UNCHECKED_CAST")
        val routines = args[3] as List<Routine>
        @Suppress("UNCHECKED_CAST")
        val allLogs = args[4] as List<RoutineLog>
        @Suppress("UNCHECKED_CAST")
        val reflections = args[5] as List<DailyReflection>
        val settings = args[6] as UserSettings
        val routineSearch = args[7] as String
        val routineCat = args[8] as String?
        val routineFilter = args[9] as String
        val goalSearch = args[10] as String
        val goalFilter = args[11] as String
        val feedback = args[12] as String?

        val today = LocalDate.now()
        val selectedDateStr = selectedDate.format(ProgressCalculationEngine.DATE_FORMATTER)
        val todayStr = today.format(ProgressCalculationEngine.DATE_FORMATTER)

        val selectedLogs = allLogs.filter { it.date == selectedDateStr }
        val todayLogs = allLogs.filter { it.date == todayStr }

        val selectedDateProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = selectedLogs,
            allLogs = allLogs,
            date = selectedDate
        )

        val todayProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = todayLogs,
            allLogs = allLogs,
            date = today
        )

        val streakStats = ConsistencyEngine.calculateStreaks(
            routines = routines,
            allLogs = allLogs,
            today = today
        )

        val goalProgressList = goals.map { goal ->
            val linkedRoutines = routines.filter { it.linkedGoalId == goal.id }
            val goalMilestones = milestones.filter { it.goalId == goal.id }
            ProgressCalculationEngine.calculateGoalProgress(
                goal = goal,
                linkedRoutines = linkedRoutines,
                allLogs = allLogs,
                milestones = goalMilestones
            )
        }

        val missedInsights = ConsistencyEngine.generateMissedInsights(
            routines = routines,
            allLogs = allLogs,
            today = today
        )

        val reflectionForSelectedDate = reflections.find { it.date == selectedDateStr }

        MainUiState(
            selectedDate = selectedDate,
            goals = goals,
            milestones = milestones,
            routines = routines,
            allLogs = allLogs,
            selectedDateProgress = selectedDateProgress,
            todayProgress = todayProgress,
            streakStats = streakStats,
            goalProgressList = goalProgressList,
            missedInsights = missedInsights,
            selectedDateReflection = reflectionForSelectedDate,
            allReflections = reflections,
            settings = settings,
            routineSearchQuery = routineSearch,
            selectedRoutineCategory = routineCat,
            routineFilterStatus = routineFilter,
            goalSearchQuery = goalSearch,
            goalFilterStatus = goalFilter,
            userFeedbackMessage = feedback
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = MainUiState()
    )

    // --- Date Navigation ---

    fun setSelectedDate(date: LocalDate) {
        _selectedDate.value = date
    }

    fun goToToday() {
        _selectedDate.value = LocalDate.now()
    }

    fun previousDay() {
        _selectedDate.value = _selectedDate.value.minusDays(1)
    }

    fun nextDay() {
        _selectedDate.value = _selectedDate.value.plusDays(1)
    }

    // --- Filter & Search ---

    fun setRoutineSearchQuery(query: String) {
        _routineSearchQuery.value = query
    }

    fun setSelectedRoutineCategory(category: String?) {
        _selectedRoutineCategory.value = category
    }

    fun setRoutineFilterStatus(status: String) {
        _routineFilterStatus.value = status
    }

    fun setGoalSearchQuery(query: String) {
        _goalSearchQuery.value = query
    }

    fun setGoalFilterStatus(status: String) {
        _goalFilterStatus.value = status
    }

    fun clearFeedbackMessage() {
        _userFeedbackMessage.value = null
    }

    // --- Routine Actions ---

    fun onRoutineCheckClicked(routine: Routine, date: LocalDate) {
        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
        val logs = uiState.value.allLogs.filter { it.routineId == routine.id && it.date == dateStr }
        val currentLog = logs.firstOrNull()

        if (currentLog?.status == LogStatus.COMPLETED) {
            // Undo completion
            viewModelScope.launch {
                try {
                    val success = repository.undoRoutineCompletion(routine.id, dateStr)
                    if (success) {
                        if (justCompletedRoutineId.value == routine.id) {
                            justCompletedRoutineId.value = null
                        }
                        _userFeedbackMessage.value = "Undone: ${routine.name}"
                    } else {
                        _userFeedbackMessage.value = "Failed to undo ${routine.name}. Please retry."
                    }
                } catch (e: Exception) {
                    _userFeedbackMessage.value = "Error undoing: ${e.message}. Please retry."
                }
            }
        } else {
            // If it's a measurable task, prompt for input
            if (routine.taskType != TaskType.CHECKBOX) {
                completingRoutineForMeasurement.value = routine
            } else {
                viewModelScope.launch {
                    try {
                        val success = repository.completeRoutine(
                            routineId = routine.id,
                            date = dateStr,
                            actualValue = 1.0
                        )
                        if (success) {
                            justCompletedRoutineId.value = routine.id
                            _userFeedbackMessage.value = "Completed: ${routine.name}"
                            evaluateCelebrations(routine, date)
                        } else {
                            _userFeedbackMessage.value = "Failed to save ${routine.name}. Please retry."
                        }
                    } catch (e: Exception) {
                        _userFeedbackMessage.value = "Error saving: ${e.message}. Please retry."
                    }
                }
            }
        }
    }

    fun completeMeasurableRoutine(routine: Routine, date: LocalDate, value: Double, notes: String) {
        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
        viewModelScope.launch {
            try {
                val success = repository.completeRoutine(
                    routineId = routine.id,
                    date = dateStr,
                    actualValue = value,
                    notes = notes
                )
                completingRoutineForMeasurement.value = null
                if (success) {
                    justCompletedRoutineId.value = routine.id
                    _userFeedbackMessage.value = "Recorded: ${routine.name} ($value ${routine.unit})"
                    evaluateCelebrations(routine, date)
                } else {
                    _userFeedbackMessage.value = "Failed to save ${routine.name}. Please retry."
                }
            } catch (e: Exception) {
                _userFeedbackMessage.value = "Error saving: ${e.message}. Please retry."
            }
        }
    }

    private suspend fun evaluateCelebrations(routine: Routine, date: LocalDate) {
        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
        val allLogs = repository.allLogs.first()
        val routines = repository.allRoutines.first()
        val goals = repository.allGoals.first()
        val milestones = repository.allMilestones.first()

        val logsForDate = allLogs.filter { it.date == dateStr }
        val dailyProgress = ProgressCalculationEngine.calculateDailyProgress(
            routines = routines,
            logsForDate = logsForDate,
            allLogs = allLogs,
            date = date
        )

        // 1. Daily 100% completion: all planned routines for the day completed
        val activePlanned = dailyProgress.totalPlanned - dailyProgress.skippedCount
        val isDailyComplete = dailyProgress.totalPlanned > 0 && activePlanned > 0 && dailyProgress.completedCount >= activePlanned
        if (isDailyComplete && !repository.hasCelebratedDaily(dateStr)) {
            repository.markCelebratedDaily(dateStr)
            val streakStats = ConsistencyEngine.calculateStreaks(routines, allLogs, LocalDate.now())
            enqueueCelebration(
                CelebrationEvent.DailyComplete(
                    date = dateStr,
                    totalRoutines = dailyProgress.totalPlanned,
                    currentStreak = streakStats.currentStreak
                )
            )
        }

        // 2. Weekly target completion (e.g. 5 / 5 target days completed in current week)
        val today = LocalDate.now()
        val streakStats = ConsistencyEngine.calculateStreaks(routines, allLogs, today)
        if (streakStats.weeklyCompletedDays >= streakStats.weeklyTargetDays) {
            val weekKey = "${today.year}-W${today.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR)}"
            if (!repository.hasCelebratedWeekly(weekKey)) {
                repository.markCelebratedWeekly(weekKey)
                enqueueCelebration(
                    CelebrationEvent.WeeklyComplete(
                        completedDays = streakStats.weeklyCompletedDays,
                        targetDays = streakStats.weeklyTargetDays,
                        consistencyPct = streakStats.weeklyConsistency
                    )
                )
            }
        }

        // 3. Goal 100% completion
        if (routine.linkedGoalId != null) {
            val goal = goals.find { it.id == routine.linkedGoalId }
            if (goal != null) {
                val linkedRoutines = routines.filter { it.linkedGoalId == goal.id }
                val goalMilestones = milestones.filter { it.goalId == goal.id }
                val goalProgress = ProgressCalculationEngine.calculateGoalProgress(
                    goal = goal,
                    linkedRoutines = linkedRoutines,
                    allLogs = allLogs,
                    milestones = goalMilestones
                )
                if (goalProgress.percentage >= 100.0 && !repository.hasCelebratedGoal(goal.id)) {
                    repository.markCelebratedGoal(goal.id)
                    enqueueCelebration(
                        CelebrationEvent.GoalComplete(
                            goalId = goal.id,
                            goalTitle = goal.title,
                            targetValue = goal.targetValue,
                            unit = goal.unit
                        )
                    )
                }
            }
        }
    }

    private fun enqueueCelebration(event: CelebrationEvent) {
        if (activeCelebration.value == null) {
            activeCelebration.value = event
        } else {
            celebrationQueue.addLast(event)
        }
    }

    fun skipRoutine(routine: Routine, date: LocalDate, notes: String = "") {
        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
        viewModelScope.launch {
            repository.skipRoutine(routine.id, dateStr, notes)
            _userFeedbackMessage.value = "Skipped: ${routine.name}"
        }
    }

    fun rescheduleRoutine(routine: Routine, fromDate: LocalDate, toDate: LocalDate) {
        val fromDateStr = fromDate.format(ProgressCalculationEngine.DATE_FORMATTER)
        val toDateStr = toDate.format(ProgressCalculationEngine.DATE_FORMATTER)
        viewModelScope.launch {
            repository.rescheduleRoutine(routine.id, fromDateStr, toDateStr)
            reschedulingRoutine.value = null
            _userFeedbackMessage.value = "Rescheduled ${routine.name} to $toDateStr"
        }
    }

    fun saveRoutine(routine: Routine) {
        viewModelScope.launch {
            if (routine.id == 0L) {
                repository.insertRoutine(routine)
                _userFeedbackMessage.value = "Added routine: ${routine.name}"
            } else {
                repository.updateRoutine(routine)
                _userFeedbackMessage.value = "Updated routine: ${routine.name}"
            }
            isAddRoutineDialogOpen.value = false
            editingRoutine.value = null
            isQuickAddSheetOpen.value = false
        }
    }

    fun deleteRoutine(routine: Routine) {
        viewModelScope.launch {
            repository.deleteRoutine(routine)
            _userFeedbackMessage.value = "Deleted routine: ${routine.name}"
        }
    }

    fun togglePauseRoutine(routine: Routine) {
        viewModelScope.launch {
            val newPaused = !routine.isPaused
            repository.setRoutinePaused(routine.id, newPaused)
            _userFeedbackMessage.value = if (newPaused) "Paused ${routine.name}" else "Resumed ${routine.name}"
        }
    }

    fun duplicateRoutine(routine: Routine) {
        viewModelScope.launch {
            repository.duplicateRoutine(routine.id)
            _userFeedbackMessage.value = "Duplicated ${routine.name}"
        }
    }

    // --- Goal Actions ---

    fun saveGoal(goal: Goal, createMilestones: Boolean) {
        viewModelScope.launch {
            if (goal.id == 0L) {
                repository.insertGoal(goal, createDefaultMilestones = createMilestones)
                _userFeedbackMessage.value = "Created goal: ${goal.title}"
            } else {
                repository.updateGoal(goal)
                _userFeedbackMessage.value = "Updated goal: ${goal.title}"
            }
            isAddGoalDialogOpen.value = false
            editingGoal.value = null
        }
    }

    fun deleteGoal(goal: Goal) {
        viewModelScope.launch {
            repository.deleteGoal(goal)
            viewingGoalDetails.value = null
            _userFeedbackMessage.value = "Deleted goal: ${goal.title}"
        }
    }

    fun updateGoalStatus(goalId: Long, status: GoalStatus) {
        viewModelScope.launch {
            repository.setGoalStatus(goalId, status)
            _userFeedbackMessage.value = "Goal status updated to $status"
            if (status == GoalStatus.COMPLETED && !repository.hasCelebratedGoal(goalId)) {
                repository.markCelebratedGoal(goalId)
                val goal = repository.allGoals.first().find { it.id == goalId }
                if (goal != null) {
                    enqueueCelebration(
                        CelebrationEvent.GoalComplete(
                            goalId = goal.id,
                            goalTitle = goal.title,
                            targetValue = goal.targetValue,
                            unit = goal.unit
                        )
                    )
                }
            }
        }
    }

    // --- Reflection Actions ---

    fun saveReflection(date: LocalDate, rating: Int, wentWell: String, couldImprove: String, notes: String) {
        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
        viewModelScope.launch {
            val reflection = DailyReflection(
                date = dateStr,
                rating = rating,
                wentWell = wentWell,
                couldImprove = couldImprove,
                notes = notes,
                updatedAt = System.currentTimeMillis()
            )
            repository.saveReflection(reflection)
            isReflectionDialogOpen.value = false
            _userFeedbackMessage.value = "Daily reflection saved!"
        }
    }

    // --- Settings Actions ---

    fun updateSettings(settings: UserSettings) {
        repository.updateSettings(settings)
        _userFeedbackMessage.value = "Settings updated"
    }

    suspend fun exportDataJson(): String {
        return repository.exportDataAsJson()
    }

    fun importDataJson(jsonString: String, onComplete: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val result = repository.importDataFromJson(jsonString)
            if (result.isSuccess) {
                val count = result.getOrNull() ?: 0
                _userFeedbackMessage.value = "Successfully imported $count items!"
                onComplete(true, "Successfully restored $count records.")
            } else {
                val err = result.exceptionOrNull()?.message ?: "Unknown format error"
                onComplete(false, "Import failed: $err")
            }
        }
    }

    fun resetAllData() {
        viewModelScope.launch {
            repository.resetAllData()
            _userFeedbackMessage.value = "All data has been reset."
        }
    }
}
