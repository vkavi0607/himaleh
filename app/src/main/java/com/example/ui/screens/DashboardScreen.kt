package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.*
import com.example.domain.AccountabilityEngine
import com.example.domain.DailyProgressResult
import com.example.domain.DashboardState
import com.example.domain.GoalProgressResult
import com.example.domain.StreakStats
import com.example.ui.components.CelebrationDialog
import androidx.compose.foundation.BorderStroke
import com.example.ui.viewmodel.MainUiState
import com.example.ui.viewmodel.MainViewModel
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: MainViewModel,
    uiState: MainUiState,
    onNavigateToGoals: () -> Unit
) {
    val selectedDate = uiState.selectedDate
    val today = LocalDate.now()
    val isToday = selectedDate == today
    val progress = uiState.selectedDateProgress

    val justCompletedRoutineId by viewModel.justCompletedRoutineId.collectAsStateWithLifecycle()
    val activeCelebration by viewModel.activeCelebration.collectAsStateWithLifecycle()

    val dateTitle = when {
        isToday -> "Today, ${selectedDate.format(DateTimeFormatter.ofPattern("MMM d"))}"
        selectedDate == today.minusDays(1) -> "Yesterday, ${selectedDate.format(DateTimeFormatter.ofPattern("MMM d"))}"
        selectedDate == today.plusDays(1) -> "Tomorrow, ${selectedDate.format(DateTimeFormatter.ofPattern("MMM d"))}"
        else -> selectedDate.format(DateTimeFormatter.ofPattern("EEE, MMM d, yyyy"))
    }

    val isCompletelyEmpty = uiState.routines.isEmpty() && uiState.goals.isEmpty()

    val dashboardState = remember(progress, selectedDate) {
        AccountabilityEngine.resolveDashboardState(
            dailyProgress = progress,
            selectedDate = selectedDate
        )
    }

    // Show Celebration Dialog if triggered
    activeCelebration?.let { celebration ->
        CelebrationDialog(
            event = celebration,
            onDismiss = { viewModel.dismissCelebration() }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Himaleh",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.isQuickAddSheetOpen.value = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.testTag("dashboard_quick_add_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Routine")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 80.dp)
        ) {
            // Date Navigation Bar
            item {
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { viewModel.previousDay() },
                            modifier = Modifier.testTag("prev_day_button")
                        ) {
                            Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Previous Day")
                        }

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clickable { viewModel.goToToday() }
                                .padding(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = dateTitle,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            if (!isToday) {
                                Text(
                                    text = "Tap to return to Today",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        IconButton(
                            onClick = { viewModel.nextDay() },
                            modifier = Modifier.testTag("next_day_button")
                        ) {
                            Icon(imageVector = Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Next Day")
                        }
                    }
                }
            }

            // If user has no goals and no routines, show clean Empty State
            if (isCompletelyEmpty) {
                item {
                    EmptyStateView(
                        onCreateGoal = { viewModel.isAddGoalDialogOpen.value = true },
                        onAddRoutine = { viewModel.isAddRoutineDialogOpen.value = true }
                    )
                }
            } else {
                // --- 1. TODAY'S PROGRESS CARD ---
                item {
                    TodayProgressCard(
                        progress = progress,
                        dashboardState = dashboardState,
                        onCompleteRoutine = { routine -> viewModel.onRoutineCheckClicked(routine, selectedDate) }
                    )
                }

                // --- ACCOUNTABILITY FEEDBACK CARD (if genuine incomplete/missed expectations) ---
                if (dashboardState is DashboardState.Accountability) {
                    item {
                        AccountabilityFeedbackCard(
                            state = dashboardState,
                            streakStats = uiState.streakStats,
                            onGetBackOnTrack = { routine -> viewModel.onRoutineCheckClicked(routine, selectedDate) }
                        )
                    }
                }

                // --- 2. NEXT ROUTINE CARD (if pending routines exist for today) ---
                val pendingRoutines = progress?.plannedRoutines?.filter {
                    !progress.completedRoutineIds.contains(it.id) && !progress.skippedRoutineIds.contains(it.id)
                } ?: emptyList()

                if (pendingRoutines.isNotEmpty() && isToday) {
                    val nextRoutine = pendingRoutines.first()
                    item {
                        NextRoutineCard(
                            routine = nextRoutine,
                            onDone = { viewModel.onRoutineCheckClicked(nextRoutine, selectedDate) }
                        )
                    }
                }

                // --- 3. TODAY'S SCHEDULED ROUTINES ---
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Today's Routines (${progress?.plannedRoutines?.size ?: 0})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        TextButton(onClick = { viewModel.isAddRoutineDialogOpen.value = true }) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Add Routine")
                        }
                    }
                }

                if (progress?.plannedRoutines.isNullOrEmpty()) {
                    item {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.SelfImprovement,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(40.dp)
                                )
                                Text(
                                    text = "No routines scheduled for this day",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Tap '+ Quick Add' below or create a recurring routine.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Button(
                                    onClick = { viewModel.isQuickAddSheetOpen.value = true },
                                    modifier = Modifier.padding(top = 8.dp)
                                ) {
                                    Text("Quick Add Routine")
                                }
                            }
                        }
                    }
                } else {
                    // Group routines by Time of Day: Morning (<12), Afternoon (12-17), Evening (17-21), Night (21+)
                    val morning = progress.plannedRoutines.filter { it.timeHour < 12 }
                    val afternoon = progress.plannedRoutines.filter { it.timeHour in 12..16 }
                    val evening = progress.plannedRoutines.filter { it.timeHour in 17..20 }
                    val night = progress.plannedRoutines.filter { it.timeHour >= 21 }

                    val timeBuckets = listOf(
                        "Morning" to morning,
                        "Afternoon" to afternoon,
                        "Evening" to evening,
                        "Night" to night
                    ).filter { it.second.isNotEmpty() }

                    for ((bucketName, bucketRoutines) in timeBuckets) {
                        item {
                            Text(
                                text = bucketName,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }

                        items(bucketRoutines, key = { it.id }) { routine ->
                            val isDone = progress.completedRoutineIds.contains(routine.id)
                            val isSkipped = progress.skippedRoutineIds.contains(routine.id)
                            val log = progress.routineLogMap[routine.id]
                            val isJustCompleted = justCompletedRoutineId == routine.id

                            RoutineItemCard(
                                routine = routine,
                                isDone = isDone,
                                isSkipped = isSkipped,
                                isJustCompleted = isJustCompleted,
                                log = log,
                                date = selectedDate,
                                onToggle = { viewModel.onRoutineCheckClicked(routine, selectedDate) },
                                onSkip = { viewModel.skipRoutine(routine, selectedDate) },
                                onReschedule = { viewModel.reschedulingRoutine.value = routine },
                                onEdit = {
                                    viewModel.editingRoutine.value = routine
                                    viewModel.isAddRoutineDialogOpen.value = true
                                },
                                onClearJustCompleted = {
                                    viewModel.clearJustCompletedRoutine(routine.id)
                                }
                            )
                        }
                    }
                }

                // --- 4. CURRENT GOAL PROGRESS CARD ---
                if (uiState.goals.isNotEmpty()) {
                    val primaryGoal = uiState.goals.firstOrNull { it.status == GoalStatus.ACTIVE } ?: uiState.goals.first()
                    val primaryGoalProgress = uiState.goalProgressList.find { it.goalId == primaryGoal.id }

                    item {
                        CurrentGoalCard(
                            goal = primaryGoal,
                            progress = primaryGoalProgress,
                            totalGoals = uiState.goals.size,
                            onViewGoals = onNavigateToGoals,
                            onGoalClick = { viewModel.viewingGoalDetails.value = primaryGoal }
                        )
                    }
                }

                // --- 5. CURRENT STREAK CARD ---
                item {
                    val streak = uiState.streakStats.currentStreak
                    val longest = uiState.streakStats.longestStreak
                    StreakCard(currentStreak = streak, longestStreak = longest)
                }

                // --- 6. WEEKLY CONSISTENCY CARD ---
                item {
                    WeeklyConsistencyCard(streakStats = uiState.streakStats)
                }

                // --- 7. DAILY REFLECTION CARD ---
                item {
                    DailyReflectionCard(
                        reflection = uiState.selectedDateReflection,
                        onOpenReflection = { viewModel.isReflectionDialogOpen.value = true }
                    )
                }
            }
        }
    }
}

// ==================== SUB-COMPONENTS ====================

@Composable
fun EmptyStateView(
    onCreateGoal: () -> Unit,
    onAddRoutine: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp)
            .testTag("dashboard_empty_state"),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🏔️", fontSize = 32.sp)
            }

            Text(
                text = "Start building your routine",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Text(
                text = "Create your first goal or routine to start tracking your progress.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onCreateGoal,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("empty_state_create_goal_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Create Goal")
                }

                Button(
                    onClick = onAddRoutine,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("empty_state_add_routine_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Add Routine")
                }
            }
        }
    }
}

@Composable
fun TodayProgressCard(
    progress: DailyProgressResult?,
    dashboardState: DashboardState = DashboardState.RestDay(),
    onCompleteRoutine: (Routine) -> Unit = {}
) {
    val total = progress?.totalPlanned ?: 0
    val completed = progress?.completedCount ?: 0
    val skipped = progress?.skippedCount ?: 0
    val pct = progress?.completionPercentage ?: 0.0

    // Smooth animated progress bar
    val animatedProgress by animateFloatAsState(
        targetValue = if (total > 0) (pct / 100.0).toFloat().coerceIn(0f, 1f) else 0f,
        animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing),
        label = "today_progress_anim"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dashboard_daily_progress_card"),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Today's Progress",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (total == 0) {
                            "Rest Day • No routines scheduled"
                        } else {
                            "$completed / $total completed"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (pct >= 100.0) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary
                ) {
                    Text(
                        text = "${pct.toInt()}%",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }
            }

            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp)),
            )

            // Dynamic Front-Screen State Display:
            // 🏆 Completion State, ⚡ In-Progress State, 😠 Accountability State
            when (dashboardState) {
                is DashboardState.Accountability -> {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.55f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("accountability_status_banner")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(dashboardState.emoji, fontSize = 24.sp)
                                Column {
                                    Text(
                                        text = dashboardState.title,
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onErrorContainer
                                    )
                                    Text(
                                        text = "Get back on track",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.8f)
                                    )
                                }
                            }
                            dashboardState.missedRoutines.firstOrNull()?.let { firstMissed ->
                                Button(
                                    onClick = { onCompleteRoutine(firstMissed) },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.testTag("accountability_complete_now_button"),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Complete Now", style = MaterialTheme.typography.labelMedium)
                                }
                            }
                        }
                    }
                }
                is DashboardState.Completed -> {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("completed_status_banner")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("🏆", fontSize = 22.sp)
                            Text(
                                text = "100% completed • Keep the streak alive! 💪",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                        }
                    }
                }
                is DashboardState.InProgress -> {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("in_progress_status_banner")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("⚡", fontSize = 22.sp)
                            Text(
                                text = dashboardState.message,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
                is DashboardState.RestDay -> {
                    if (skipped > 0) {
                        Text(
                            text = "$skipped routine${if (skipped > 1) "s" else ""} skipped today",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (skipped > 0 && dashboardState !is DashboardState.RestDay) {
                Text(
                    text = "$skipped routine${if (skipped > 1) "s" else ""} skipped today",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun AccountabilityFeedbackCard(
    state: DashboardState.Accountability,
    streakStats: StreakStats,
    onGetBackOnTrack: (Routine) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("accountability_feedback_card"),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.25f)
        ),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.4f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(text = state.emoji, fontSize = 32.sp)
                Column {
                    Text(
                        text = state.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Text(
                        text = state.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            // Stats row: Incomplete count, Completion %, Streak status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${state.missedCount}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error
                    )
                    Text(
                        text = "Incomplete",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${state.percentage.toInt()}%",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Completed",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${streakStats.currentStreak} 🔥",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.tertiary
                    )
                    Text(
                        text = "Current Streak",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Which routines were missed
            Text(
                text = "Missed Routines:",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                state.missedRoutines.forEach { routine ->
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "• ${routine.name}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = String.format("%02d:%02d", routine.timeHour, routine.timeMinute),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Button(
                onClick = {
                    state.missedRoutines.firstOrNull()?.let { onGetBackOnTrack(it) }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("get_back_on_track_button"),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.TrendingUp, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Get Back on Track", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun NextRoutineCard(
    routine: Routine,
    onDone: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dashboard_next_routine_card"),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "NEXT ROUTINE",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = routine.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = String.format("%02d:%02d • %d mins", routine.timeHour, routine.timeMinute, routine.durationMinutes),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = onDone,
                modifier = Modifier.testTag("complete_next_routine_button"),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Done")
            }
        }
    }
}

@Composable
fun CurrentGoalCard(
    goal: Goal,
    progress: GoalProgressResult?,
    totalGoals: Int,
    onViewGoals: () -> Unit,
    onGoalClick: () -> Unit
) {
    val pct = progress?.percentage ?: 0.0
    val animatedProgress by animateFloatAsState(
        targetValue = (pct / 100.0).toFloat().coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing),
        label = "current_goal_progress_anim"
    )

    Card(
        onClick = onGoalClick,
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dashboard_current_goal_card"),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(text = "🎯", fontSize = 16.sp)
                    Text(
                        text = "CURRENT GOAL",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                TextButton(
                    onClick = onViewGoals,
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text("View All ($totalGoals)", style = MaterialTheme.typography.labelMedium)
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = goal.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )

                Text(
                    text = "${pct.toInt()}%",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
            )

            Text(
                text = if (progress != null) {
                    "${progress.currentValue} / ${goal.targetValue} ${goal.unit}"
                } else {
                    "Target: ${goal.targetValue} ${goal.unit}"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun StreakCard(currentStreak: Int, longestStreak: Int) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (currentStreak > 0) MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f) else MaterialTheme.colorScheme.surfaceVariant
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dashboard_streak_card"),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "🔥",
                    style = MaterialTheme.typography.headlineMedium
                )
                Column {
                    Text(
                        text = if (currentStreak > 0) "$currentStreak Day Streak!" else "Start Your Streak!",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (currentStreak > 0) "Personal best: $longestStreak days" else "Complete today's routines to ignite momentum",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun WeeklyConsistencyCard(streakStats: com.example.domain.StreakStats) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dashboard_weekly_consistency_card"),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "Weekly Consistency",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${streakStats.weeklyCompletedDays} / ${streakStats.weeklyTargetDays} days completed",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Text(
                    text = "${streakStats.weeklyConsistency.toInt()}% wk",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
fun DailyReflectionCard(
    reflection: DailyReflection?,
    onOpenReflection: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("dashboard_daily_reflection_card"),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Daily Reflection",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                if (reflection != null) {
                    Row {
                        repeat(reflection.rating) {
                            Text("⭐", fontSize = 14.sp)
                        }
                    }
                }
            }

            if (reflection != null) {
                if (reflection.notes.isNotBlank()) {
                    Text(
                        text = "\"${reflection.notes}\"",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                TextButton(
                    onClick = onOpenReflection,
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text("Edit Reflection")
                }
            } else {
                Text(
                    text = "Reflect on today's focus, wins, and obstacles.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Button(
                    onClick = onOpenReflection,
                    modifier = Modifier.padding(top = 4.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Write Reflection")
                }
            }
        }
    }
}

@Composable
fun RoutineItemCard(
    routine: Routine,
    isDone: Boolean,
    isSkipped: Boolean,
    isJustCompleted: Boolean,
    log: RoutineLog?,
    date: LocalDate,
    onToggle: () -> Unit,
    onSkip: () -> Unit,
    onReschedule: () -> Unit,
    onEdit: () -> Unit,
    onClearJustCompleted: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    val haptic = LocalHapticFeedback.current

    // Spring scale animation for checkmark bounce
    val checkmarkScale by animateFloatAsState(
        targetValue = if (isDone) 1.15f else 1.0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "checkmark_bounce"
    )

    // Animated container color transition
    val containerColor by animateColorAsState(
        targetValue = when {
            isDone -> MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.35f)
            isSkipped -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f)
            else -> MaterialTheme.colorScheme.surface
        },
        animationSpec = tween(durationMillis = 300),
        label = "container_color_anim"
    )

    // Trigger haptics and clear animation after completion
    LaunchedEffect(isJustCompleted) {
        if (isJustCompleted) {
            try {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
            } catch (_: Exception) {}
            delay(750)
            onClearJustCompleted()
        }
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isDone || isSkipped) 0.dp else 1.dp),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            // Mini particle burst if just completed
            if (isJustCompleted) {
                Canvas(
                    modifier = Modifier
                        .matchParentSize()
                        .clip(RoundedCornerShape(14.dp))
                ) {
                    val colors = listOf(Color(0xFF4CAF50), Color(0xFFFFEB3B), Color(0xFF2196F3), Color(0xFFE91E63))
                    val rnd = Random(routine.id)
                    for (i in 0..15) {
                        val angle = rnd.nextFloat() * 6.28f
                        val dist = 20f + rnd.nextFloat() * 60f
                        val x = 32f + kotlin.math.cos(angle) * dist
                        val y = size.height / 2f + kotlin.math.sin(angle) * dist
                        drawCircle(
                            color = colors[i % colors.size].copy(alpha = 0.8f),
                            radius = 4f,
                            center = Offset(x, y)
                        )
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Checkbox / Status Circle Button with Bounce Animation
                IconButton(
                    onClick = onToggle,
                    modifier = Modifier
                        .size(48.dp)
                        .scale(checkmarkScale)
                        .testTag("routine_checkbox_${routine.id}")
                ) {
                    when {
                        isDone -> Icon(
                            imageVector = Icons.Filled.CheckCircle,
                            contentDescription = "Completed",
                            tint = MaterialTheme.colorScheme.tertiary,
                            modifier = Modifier.size(28.dp)
                        )
                        isSkipped -> Icon(
                            imageVector = Icons.Default.FastForward,
                            contentDescription = "Skipped",
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(24.dp)
                        )
                        else -> Icon(
                            imageVector = Icons.Outlined.Circle,
                            contentDescription = "Incomplete",
                            tint = MaterialTheme.colorScheme.outline,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }

                // Info Column
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onToggle() }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = routine.name,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isDone) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f) else MaterialTheme.colorScheme.onSurface
                        )
                        if (isSkipped) {
                            Surface(
                                shape = MaterialTheme.shapes.extraSmall,
                                color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = "Skipped",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.secondary,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = String.format("%02d:%02d", routine.timeHour, routine.timeMinute),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text("•", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outlineVariant)
                        Text(
                            text = routine.category,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (routine.taskType != TaskType.CHECKBOX) {
                            Text("•", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outlineVariant)
                            Text(
                                text = if (isDone && log != null) "${log.actualValue} / ${routine.targetValue} ${routine.unit}" else "${routine.targetValue} ${routine.unit}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // More Options Menu
                Box {
                    IconButton(
                        onClick = { showMenu = true },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(imageVector = Icons.Default.MoreVert, contentDescription = "Options")
                    }
                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        if (!isSkipped && !isDone) {
                            DropdownMenuItem(
                                text = { Text("Skip for Today") },
                                onClick = {
                                    showMenu = false
                                    onSkip()
                                },
                                leadingIcon = { Icon(Icons.Default.FastForward, contentDescription = null) }
                            )
                            DropdownMenuItem(
                                text = { Text("Reschedule") },
                                onClick = {
                                    showMenu = false
                                    onReschedule()
                                },
                                leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null) }
                            )
                        }
                        DropdownMenuItem(
                            text = { Text("Edit Routine") },
                            onClick = {
                                showMenu = false
                                onEdit()
                            },
                            leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) }
                        )
                    }
                }
            }
        }
    }
}
