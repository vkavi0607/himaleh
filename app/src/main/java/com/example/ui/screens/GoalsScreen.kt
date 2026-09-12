package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.Goal
import com.example.data.model.GoalPriority
import com.example.data.model.GoalStatus
import com.example.domain.GoalProgressResult
import com.example.ui.viewmodel.MainUiState
import com.example.ui.viewmodel.MainViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoalsScreen(
    viewModel: MainViewModel,
    uiState: MainUiState
) {
    val filteredGoals = remember(
        uiState.goals,
        uiState.goalSearchQuery,
        uiState.goalFilterStatus
    ) {
        uiState.goals.filter { goal ->
            val matchesQuery = uiState.goalSearchQuery.isBlank() ||
                    goal.title.contains(uiState.goalSearchQuery, ignoreCase = true) ||
                    goal.description.contains(uiState.goalSearchQuery, ignoreCase = true) ||
                    goal.motivation.contains(uiState.goalSearchQuery, ignoreCase = true)

            val matchesStatus = when (uiState.goalFilterStatus) {
                "ACTIVE" -> goal.status == GoalStatus.ACTIVE
                "PAUSED" -> goal.status == GoalStatus.PAUSED
                "COMPLETED" -> goal.status == GoalStatus.COMPLETED
                "ARCHIVED" -> goal.status == GoalStatus.ARCHIVED
                else -> true
            }

            matchesQuery && matchesStatus
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    viewModel.editingGoal.value = null
                    viewModel.isAddGoalDialogOpen.value = true
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.testTag("add_goal_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Goal")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = uiState.goalSearchQuery,
                onValueChange = { viewModel.setGoalSearchQuery(it) },
                placeholder = { Text("Search goals...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (uiState.goalSearchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.setGoalSearchQuery("") }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .testTag("goal_search_input")
            )

            // Status Filter Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "ALL" to "All Goals",
                    "ACTIVE" to "Active",
                    "PAUSED" to "Paused",
                    "COMPLETED" to "Completed"
                ).forEach { (code, label) ->
                    item {
                        FilterChip(
                            selected = uiState.goalFilterStatus == code,
                            onClick = { viewModel.setGoalFilterStatus(code) },
                            label = { Text(label) },
                            modifier = Modifier.testTag("goal_filter_$code")
                        )
                    }
                }
            }

            // Goals list
            if (filteredGoals.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Flag,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.outlineVariant,
                            modifier = Modifier.size(56.dp)
                        )
                        Text(
                            text = if (uiState.goals.isEmpty()) "No goals set yet" else "No matching goals",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (uiState.goals.isEmpty()) "Define clear goals with measurable milestones and link daily routines to them." else "Try adjusting your search query or status filter.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (uiState.goals.isEmpty()) {
                            Button(
                                onClick = { viewModel.isAddGoalDialogOpen.value = true },
                                modifier = Modifier.padding(top = 8.dp)
                            ) {
                                Text("Create First Goal")
                            }
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(filteredGoals, key = { it.id }) { goal ->
                        val progress = uiState.goalProgressList.find { it.goalId == goal.id }
                        GoalCard(
                            goal = goal,
                            progress = progress,
                            onClick = { viewModel.viewingGoalDetails.value = goal }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun GoalCard(
    goal: Goal,
    progress: GoalProgressResult?,
    onClick: () -> Unit
) {
    val pct = progress?.percentage ?: 0.0
    val currentVal = progress?.currentValue ?: 0.0

    val today = LocalDate.now()
    val endDate = try {
        LocalDate.parse(goal.endDate, DateTimeFormatter.ISO_LOCAL_DATE)
    } catch (e: Exception) {
        today
    }
    val daysLeft = ChronoUnit.DAYS.between(today, endDate).toInt()

    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = if (goal.status == GoalStatus.COMPLETED) MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.35f) else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = goal.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = goal.category,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = when (goal.status) {
                        GoalStatus.COMPLETED -> MaterialTheme.colorScheme.tertiary
                        GoalStatus.PAUSED -> MaterialTheme.colorScheme.outlineVariant
                        else -> MaterialTheme.colorScheme.primaryContainer
                    }
                ) {
                    Text(
                        text = "${pct.toInt()}%",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (goal.status == GoalStatus.COMPLETED) MaterialTheme.colorScheme.onTertiary else MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            LinearProgressIndicator(
                progress = { (pct / 100.0).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(MaterialTheme.shapes.small),
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$currentVal / ${goal.targetValue} ${goal.unit}",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium
                )

                Text(
                    text = if (daysLeft >= 0) "$daysLeft days left" else "Ended",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (progress != null && progress.linkedRoutineCount > 0) {
                Text(
                    text = "🔗 ${progress.linkedRoutineCount} linked routines active",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
