package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.Goal
import com.example.data.model.GoalStatus
import com.example.data.model.Routine
import com.example.domain.GoalProgressResult
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoalDetailsDialog(
    goal: Goal,
    progress: GoalProgressResult?,
    linkedRoutines: List<Routine>,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onStatusChange: (GoalStatus) -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    val pct = progress?.percentage ?: 0.0
    val currentVal = progress?.currentValue ?: 0.0

    val today = LocalDate.now()
    val endDateParsed = try {
        LocalDate.parse(goal.endDate, DateTimeFormatter.ISO_LOCAL_DATE)
    } catch (e: Exception) {
        today
    }
    val daysLeft = ChronoUnit.DAYS.between(today, endDateParsed).toInt()

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Goal?") },
            text = { Text("Are you sure you want to delete '${goal.title}' and all its milestones? This cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirm = false
                        onDelete()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = goal.title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = goal.category,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                AssistChip(
                    onClick = {},
                    label = { Text(goal.status.name) }
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Progress Card
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Progress: ${pct.toInt()}%",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "$currentVal / ${goal.targetValue} ${goal.unit}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        LinearProgressIndicator(
                            progress = { (pct / 100.0).toFloat().coerceIn(0f, 1f) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp),
                        )

                        Text(
                            text = if (daysLeft >= 0) "$daysLeft days remaining until ${goal.endDate}" else "Target deadline passed (${goal.endDate})",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Motivation section
                if (goal.motivation.isNotBlank()) {
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                        shape = MaterialTheme.shapes.medium,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "💡 Motivation (Your 'Why')",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "\"${goal.motivation}\"",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }

                // Milestones Timeline
                if (!progress?.milestones.isNullOrEmpty()) {
                    Text(
                        text = "Milestones Checkpoints",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        progress?.milestones?.forEach { milestone ->
                            val isAchieved = milestone.achievedAt != null
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = if (isAchieved) Icons.Filled.CheckCircle else Icons.Outlined.Circle,
                                    contentDescription = null,
                                    tint = if (isAchieved) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = milestone.title,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = if (isAchieved) FontWeight.Bold else FontWeight.Normal
                                    )
                                    Text(
                                        text = "${milestone.targetPercentage}% • ${milestone.targetValue} ${goal.unit}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (isAchieved) {
                                    AssistChip(
                                        onClick = {},
                                        label = { Text("Done", style = MaterialTheme.typography.labelSmall) }
                                    )
                                }
                            }
                        }
                    }
                }

                // Linked Routines
                Text(
                    text = "Supporting Routines (${linkedRoutines.size})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )

                if (linkedRoutines.isEmpty()) {
                    Text(
                        text = "No routines currently linked to this goal. Link routines to automatically advance goal progress!",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        linkedRoutines.forEach { routine ->
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                                shape = MaterialTheme.shapes.small,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = routine.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = routine.frequency.name,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }

                Divider()

                // Status Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (goal.status != GoalStatus.COMPLETED) {
                        Button(
                            onClick = { onStatusChange(GoalStatus.COMPLETED) },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Mark Complete")
                        }
                    } else {
                        OutlinedButton(
                            onClick = { onStatusChange(GoalStatus.ACTIVE) },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Reactivate")
                        }
                    }

                    if (goal.status == GoalStatus.ACTIVE) {
                        OutlinedButton(
                            onClick = { onStatusChange(GoalStatus.PAUSED) },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Pause")
                        }
                    } else if (goal.status == GoalStatus.PAUSED) {
                        OutlinedButton(
                            onClick = { onStatusChange(GoalStatus.ACTIVE) },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Resume")
                        }
                    }
                }
            }
        },
        confirmButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = onEdit) {
                    Icon(imageVector = Icons.Default.Edit, contentDescription = "Edit Goal")
                }
                IconButton(onClick = { showDeleteConfirm = true }) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete Goal",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
                TextButton(onClick = onDismiss) {
                    Text("Close")
                }
            }
        },
        dismissButton = {}
    )
}
