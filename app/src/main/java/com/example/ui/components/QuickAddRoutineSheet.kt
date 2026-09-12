package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.Routine
import com.example.data.model.RoutineFrequency
import com.example.data.model.RoutinePriority
import com.example.data.model.TaskType
import com.example.domain.ProgressCalculationEngine
import java.time.LocalDate

data class QuickRoutinePreset(
    val name: String,
    val category: String,
    val hour: Int,
    val minute: Int,
    val taskType: TaskType,
    val targetVal: Double,
    val unit: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickAddRoutineSheet(
    onDismiss: () -> Unit,
    onSave: (Routine) -> Unit
) {
    val presets = listOf(
        QuickRoutinePreset("Morning Meditation", "Mindset", 7, 0, TaskType.DURATION, 15.0, "min"),
        QuickRoutinePreset("Drink 2L Water", "Health", 8, 0, TaskType.QUANTITY, 2.0, "L"),
        QuickRoutinePreset("30 min Workout", "Fitness", 18, 0, TaskType.DURATION, 30.0, "min"),
        QuickRoutinePreset("Read 20 Pages", "Study", 21, 0, TaskType.COUNT, 20.0, "pages"),
        QuickRoutinePreset("Daily Journaling", "Personal", 21, 30, TaskType.CHECKBOX, 1.0, ""),
        QuickRoutinePreset("Deep Focus Block", "Work", 9, 30, TaskType.DURATION, 45.0, "min")
    )

    var name by remember { mutableStateOf("") }
    var selectedPreset by remember { mutableStateOf<QuickRoutinePreset?>(null) }
    var timeHour by remember { mutableIntStateOf(9) }
    var timeMinute by remember { mutableIntStateOf(0) }
    var errorText by remember { mutableStateOf<String?>(null) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        modifier = Modifier.testTag("quick_add_sheet")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "⚡ Quick Add Routine",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Popular Productivity Routines",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Preset suggestions - 2 columns with overflow ellipsis and min touch target
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                presets.chunked(2).forEach { rowPresets ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        rowPresets.forEach { preset ->
                            FilterChip(
                                selected = selectedPreset == preset,
                                onClick = {
                                    selectedPreset = preset
                                    name = preset.name
                                    timeHour = preset.hour
                                    timeMinute = preset.minute
                                    errorText = null
                                },
                                label = {
                                    Text(
                                        text = preset.name,
                                        maxLines = 1,
                                        softWrap = false,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .heightIn(min = 44.dp)
                            )
                        }
                    }
                }
            }

            OutlinedTextField(
                value = name,
                onValueChange = {
                    name = it
                    errorText = null
                },
                label = { Text("Routine Name") },
                placeholder = { Text("e.g. 10,000 steps") },
                singleLine = true,
                isError = errorText != null,
                supportingText = errorText?.let { { Text(it) } },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("quick_routine_name_input")
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Scheduled Time: ${String.format("%02d:%02d", timeHour, timeMinute)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                // 2x2 grid for time presets so labels never truncate or squeeze
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(
                        "07:00 (Morning)" to (7 to 0),
                        "09:00 (Work)" to (9 to 0),
                        "18:00 (Evening)" to (18 to 0),
                        "21:00 (Night)" to (21 to 0)
                    ).chunked(2).forEach { rowTimes ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            rowTimes.forEach { (lbl, time) ->
                                AssistChip(
                                    onClick = {
                                        timeHour = time.first
                                        timeMinute = time.second
                                    },
                                    label = {
                                        Text(
                                            text = lbl,
                                            maxLines = 1,
                                            softWrap = false
                                        )
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }

            Button(
                onClick = {
                    if (name.isBlank()) {
                        errorText = "Please enter or pick a routine name"
                        return@Button
                    }
                    val preset = selectedPreset
                    val routine = Routine(
                        name = name.trim(),
                        category = preset?.category ?: "Personal",
                        startDate = LocalDate.now().format(ProgressCalculationEngine.DATE_FORMATTER),
                        timeHour = timeHour,
                        timeMinute = timeMinute,
                        frequency = RoutineFrequency.DAILY,
                        taskType = preset?.taskType ?: TaskType.CHECKBOX,
                        targetValue = preset?.targetVal ?: 1.0,
                        unit = preset?.unit ?: "",
                        priority = RoutinePriority.MEDIUM,
                        reminderEnabled = true
                    )
                    onSave(routine)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
                    .testTag("submit_quick_add_button")
            ) {
                Text("Add Routine to Schedule", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
