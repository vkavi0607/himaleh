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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.Routine
import com.example.data.model.RoutineFrequency
import com.example.ui.viewmodel.MainUiState
import com.example.ui.viewmodel.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoutinesScreen(
    viewModel: MainViewModel,
    uiState: MainUiState
) {
    var routineToDelete by remember { mutableStateOf<Routine?>(null) }

    val categories = listOf("All", "Personal", "Health", "Fitness", "Work", "Study", "Mindset")

    // Filter routines
    val filteredRoutines = remember(
        uiState.routines,
        uiState.routineSearchQuery,
        uiState.selectedRoutineCategory,
        uiState.routineFilterStatus
    ) {
        uiState.routines.filter { routine ->
            val matchesQuery = uiState.routineSearchQuery.isBlank() ||
                    routine.name.contains(uiState.routineSearchQuery, ignoreCase = true) ||
                    routine.description.contains(uiState.routineSearchQuery, ignoreCase = true)

            val matchesCat = uiState.selectedRoutineCategory == null ||
                    uiState.selectedRoutineCategory == "All" ||
                    routine.category.equals(uiState.selectedRoutineCategory, ignoreCase = true)

            val matchesStatus = when (uiState.routineFilterStatus) {
                "ACTIVE" -> !routine.isPaused
                "PAUSED" -> routine.isPaused
                else -> true
            }

            matchesQuery && matchesCat && matchesStatus
        }
    }

    if (routineToDelete != null) {
        AlertDialog(
            onDismissRequest = { routineToDelete = null },
            title = { Text("Delete Routine?") },
            text = { Text("Delete '${routineToDelete?.name}'? Historical completion logs for past days will also be cleaned.") },
            confirmButton = {
                Button(
                    onClick = {
                        routineToDelete?.let { viewModel.deleteRoutine(it) }
                        routineToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { routineToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    viewModel.editingRoutine.value = null
                    viewModel.isAddRoutineDialogOpen.value = true
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.testTag("add_routine_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Routine")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            // Search field
            OutlinedTextField(
                value = uiState.routineSearchQuery,
                onValueChange = { viewModel.setRoutineSearchQuery(it) },
                placeholder = { Text("Search routines...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (uiState.routineSearchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.setRoutineSearchQuery("") }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .testTag("routine_search_input")
            )

            // Category Filter Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { cat ->
                    val isSelected = (cat == "All" && uiState.selectedRoutineCategory == null) ||
                            uiState.selectedRoutineCategory == cat
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            viewModel.setSelectedRoutineCategory(if (cat == "All") null else cat)
                        },
                        label = { Text(cat) },
                        modifier = Modifier.testTag("filter_chip_$cat")
                    )
                }
            }

            // Status Filter Row (All, Active, Paused)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("ALL" to "All Routines", "ACTIVE" to "Active Only", "PAUSED" to "Paused").forEach { (code, label) ->
                    FilterChip(
                        selected = uiState.routineFilterStatus == code,
                        onClick = { viewModel.setRoutineFilterStatus(code) },
                        label = { Text(label, style = MaterialTheme.typography.bodySmall) }
                    )
                }
            }

            // List of routines
            if (filteredRoutines.isEmpty()) {
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
                            imageVector = Icons.Default.EventNote,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.outlineVariant,
                            modifier = Modifier.size(56.dp)
                        )
                        Text(
                            text = if (uiState.routines.isEmpty()) "No routines yet" else "No routines match filter",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (uiState.routines.isEmpty()) "Create daily or weekly routines to build consistency." else "Try adjusting your search query or category filter.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (uiState.routines.isEmpty()) {
                            Button(
                                onClick = { viewModel.isAddRoutineDialogOpen.value = true },
                                modifier = Modifier.padding(top = 8.dp)
                            ) {
                                Text("Create First Routine")
                            }
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(filteredRoutines, key = { it.id }) { routine ->
                        RoutineManagementCard(
                            routine = routine,
                            onTogglePause = { viewModel.togglePauseRoutine(routine) },
                            onDuplicate = { viewModel.duplicateRoutine(routine) },
                            onEdit = {
                                viewModel.editingRoutine.value = routine
                                viewModel.isAddRoutineDialogOpen.value = true
                            },
                            onDelete = { routineToDelete = routine }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RoutineManagementCard(
    routine: Routine,
    onTogglePause: () -> Unit,
    onDuplicate: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (routine.isPaused) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f) else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (routine.isPaused) 0.dp else 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = routine.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (routine.isPaused) {
                        Surface(
                            shape = MaterialTheme.shapes.extraSmall,
                            color = MaterialTheme.colorScheme.outlineVariant
                        ) {
                            Text(
                                text = "PAUSED",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                ) {
                    Text(
                        text = routine.category,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            if (routine.description.isNotBlank()) {
                Text(
                    text = routine.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "⏰ ${String.format("%02d:%02d", routine.timeHour, routine.timeMinute)} (${routine.durationMinutes}m)",
                    style = MaterialTheme.typography.bodySmall
                )
                Text("•", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outlineVariant)
                Text(
                    text = when (routine.frequency) {
                        RoutineFrequency.DAILY -> "Every Day"
                        RoutineFrequency.WEEKDAYS -> "Mon-Fri"
                        RoutineFrequency.WEEKLY_X_TIMES -> "${routine.weeklyTargetTimes}x / week"
                        RoutineFrequency.CUSTOM_DAYS -> "Custom Days"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.secondary
                )
                if (routine.reminderEnabled) {
                    Text("•", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outlineVariant)
                    Icon(
                        imageVector = Icons.Default.NotificationsActive,
                        contentDescription = "Reminders on",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Divider(modifier = Modifier.padding(vertical = 2.dp))

            // Action Buttons Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onTogglePause) {
                    Text(if (routine.isPaused) "Resume" else "Pause")
                }
                IconButton(onClick = onDuplicate, modifier = Modifier.size(36.dp)) {
                    Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Duplicate")
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                    Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit")
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}
