package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.*
import com.example.domain.ProgressCalculationEngine
import java.time.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditRoutineDialog(
    initialRoutine: Routine?,
    goals: List<Goal>,
    onDismiss: () -> Unit,
    onSave: (Routine) -> Unit
) {
    val isEdit = initialRoutine != null

    var name by remember { mutableStateOf(initialRoutine?.name ?: "") }
    var description by remember { mutableStateOf(initialRoutine?.description ?: "") }
    var category by remember { mutableStateOf(initialRoutine?.category ?: "Personal") }
    var linkedGoalId by remember { mutableStateOf(initialRoutine?.linkedGoalId) }

    var timeHour by remember { mutableIntStateOf(initialRoutine?.timeHour ?: 8) }
    var timeMinute by remember { mutableIntStateOf(initialRoutine?.timeMinute ?: 0) }
    var durationMinutes by remember { mutableIntStateOf(initialRoutine?.durationMinutes ?: 30) }

    var frequency by remember { mutableStateOf(initialRoutine?.frequency ?: RoutineFrequency.DAILY) }
    var frequencyDays by remember {
        mutableStateOf(
            if (initialRoutine != null) {
                ProgressCalculationEngine.parseFrequencyDays(initialRoutine.frequencyDays)
            } else setOf(1, 2, 3, 4, 5, 6, 7)
        )
    }
    var weeklyTargetTimes by remember { mutableIntStateOf(initialRoutine?.weeklyTargetTimes ?: 3) }

    var taskType by remember { mutableStateOf(initialRoutine?.taskType ?: TaskType.CHECKBOX) }
    var targetValueText by remember {
        mutableStateOf(
            if (initialRoutine != null) initialRoutine.targetValue.toString().removeSuffix(".0") else "1"
        )
    }
    var unit by remember { mutableStateOf(initialRoutine?.unit ?: "") }
    var priority by remember { mutableStateOf(initialRoutine?.priority ?: RoutinePriority.MEDIUM) }
    var reminderEnabled by remember { mutableStateOf(initialRoutine?.reminderEnabled ?: true) }

    var nameError by remember { mutableStateOf<String?>(null) }
    var targetValueError by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    val categories = listOf("Personal", "Health", "Fitness", "Work", "Study", "Mindset")

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .widthIn(min = 320.dp, max = 560.dp)
                .heightIn(max = 760.dp)
                .imePadding(),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp,
            shadowElevation = 8.dp
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Fixed Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 20.dp, end = 12.dp, top = 16.dp, bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.size(38.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Repeat,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Column {
                            Text(
                                text = if (isEdit) "Edit Routine" else "New Routine",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (isEdit) "Update habit schedule" else "Build consistency with daily action",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("close_routine_dialog_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                // Scrollable Form Content
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f, fill = false)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // SECTION 1: BASIC INFO
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Routine Details",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = name,
                            onValueChange = {
                                name = it
                                nameError = null
                            },
                            label = { Text("Routine Name *") },
                            placeholder = { Text("e.g. 20 min Cardio, Read 10 Pages") },
                            singleLine = true,
                            isError = nameError != null,
                            supportingText = nameError?.let { { Text(it) } },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("routine_name_input")
                        )

                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Description / Habit Cue") },
                            placeholder = { Text("After I pour my morning coffee, I will...") },
                            minLines = 2,
                            maxLines = 3,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("routine_desc_input")
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 2: CATEGORY & LINKED GOAL
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Category",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        // 2-Column Responsive Category Grid
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            categories.chunked(2).forEach { rowCats ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    rowCats.forEach { cat ->
                                        FilterChip(
                                            selected = category == cat,
                                            onClick = { category = cat },
                                            label = {
                                                Text(
                                                    text = cat,
                                                    maxLines = 1,
                                                    softWrap = false,
                                                    overflow = TextOverflow.Ellipsis,
                                                    fontWeight = if (category == cat) FontWeight.Bold else FontWeight.Normal
                                                )
                                            },
                                            modifier = Modifier
                                                .weight(1f)
                                                .heightIn(min = 44.dp)
                                                .testTag("category_chip_$cat")
                                        )
                                    }
                                }
                            }
                        }

                        // Linked Goal
                        if (goals.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Link to Goal (Optional)",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                val goalOptions = listOf<Pair<Long?, String>>(null to "No Linked Goal") +
                                        goals.map { it.id to it.title }

                                goalOptions.chunked(2).forEach { rowOpts ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        rowOpts.forEach { (gId, gTitle) ->
                                            FilterChip(
                                                selected = linkedGoalId == gId,
                                                onClick = { linkedGoalId = gId },
                                                label = {
                                                    Text(
                                                        text = gTitle,
                                                        maxLines = 1,
                                                        softWrap = false,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                },
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .heightIn(min = 40.dp)
                                            )
                                        }
                                        if (rowOpts.size == 1) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 3: TIME & DURATION
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Time & Duration",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AccessTime,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = "Scheduled Time:",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(
                                    text = String.format("%02d:%02d", timeHour, timeMinute),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        // Quick time presets (2x2 grid)
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

                        // Duration presets
                        Text(
                            text = "Duration: $durationMinutes min",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(15, 30, 45, 60).forEach { mins ->
                                FilterChip(
                                    selected = durationMinutes == mins,
                                    onClick = { durationMinutes = mins },
                                    label = {
                                        Text(
                                            text = "${mins}m",
                                            maxLines = 1,
                                            softWrap = false,
                                            fontWeight = if (durationMinutes == mins) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 4: FREQUENCY
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Frequency & Schedule",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        // 3-Option Frequency Selection with ample width
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = frequency == RoutineFrequency.DAILY,
                                onClick = { frequency = RoutineFrequency.DAILY },
                                label = { Text("Daily", maxLines = 1, softWrap = false) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = frequency == RoutineFrequency.WEEKDAYS,
                                onClick = { frequency = RoutineFrequency.WEEKDAYS },
                                label = { Text("Weekdays", maxLines = 1, softWrap = false) },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = frequency == RoutineFrequency.CUSTOM_DAYS,
                                onClick = { frequency = RoutineFrequency.CUSTOM_DAYS },
                                label = { Text("Custom", maxLines = 1, softWrap = false) },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (frequency == RoutineFrequency.CUSTOM_DAYS) {
                            Text(
                                text = "Select Active Days",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                listOf(
                                    1 to "M",
                                    2 to "T",
                                    3 to "W",
                                    4 to "T",
                                    5 to "F",
                                    6 to "S",
                                    7 to "S"
                                ).forEach { (dayVal, label) ->
                                    FilterChip(
                                        selected = frequencyDays.contains(dayVal),
                                        onClick = {
                                            frequencyDays = if (frequencyDays.contains(dayVal)) {
                                                if (frequencyDays.size > 1) frequencyDays - dayVal else frequencyDays
                                            } else {
                                                frequencyDays + dayVal
                                            }
                                        },
                                        label = { Text(label, fontWeight = FontWeight.Bold) },
                                        modifier = Modifier.size(width = 40.dp, height = 40.dp)
                                    )
                                }
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 5: TASK TYPE & TARGET
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Task Type",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        // 2x2 Grid for Task Types (avoids horizontal squeeze!)
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                FilterChip(
                                    selected = taskType == TaskType.CHECKBOX,
                                    onClick = { taskType = TaskType.CHECKBOX },
                                    label = { Text("Checkbox (Done/Not Done)", maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) },
                                    modifier = Modifier.weight(1f).heightIn(min = 44.dp)
                                )
                                FilterChip(
                                    selected = taskType == TaskType.DURATION,
                                    onClick = {
                                        taskType = TaskType.DURATION
                                        unit = "min"
                                        targetValueText = "30"
                                    },
                                    label = { Text("Duration (Time spent)", maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) },
                                    modifier = Modifier.weight(1f).heightIn(min = 44.dp)
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                FilterChip(
                                    selected = taskType == TaskType.QUANTITY,
                                    onClick = {
                                        taskType = TaskType.QUANTITY
                                        unit = "L"
                                        targetValueText = "2"
                                    },
                                    label = { Text("Quantity (e.g. 2L water)", maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) },
                                    modifier = Modifier.weight(1f).heightIn(min = 44.dp)
                                )
                                FilterChip(
                                    selected = taskType == TaskType.COUNT,
                                    onClick = {
                                        taskType = TaskType.COUNT
                                        unit = "reps"
                                        targetValueText = "25"
                                    },
                                    label = { Text("Count (e.g. 20 pages)", maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) },
                                    modifier = Modifier.weight(1f).heightIn(min = 44.dp)
                                )
                            }
                        }

                        if (taskType != TaskType.CHECKBOX) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedTextField(
                                    value = targetValueText,
                                    onValueChange = {
                                        targetValueText = it
                                        targetValueError = null
                                    },
                                    label = { Text("Target *") },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    isError = targetValueError != null,
                                    supportingText = targetValueError?.let { { Text(it) } },
                                    modifier = Modifier.weight(1.2f)
                                )
                                OutlinedTextField(
                                    value = unit,
                                    onValueChange = { unit = it },
                                    label = { Text("Unit") },
                                    placeholder = { Text("e.g. min, km, pages") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 6: PRIORITY & REMINDERS
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Priority & Reminder",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(
                                RoutinePriority.LOW to "Low",
                                RoutinePriority.MEDIUM to "Medium",
                                RoutinePriority.HIGH to "High"
                            ).forEach { (p, label) ->
                                FilterChip(
                                    selected = priority == p,
                                    onClick = { priority = p },
                                    label = {
                                        Text(
                                            text = label,
                                            maxLines = 1,
                                            softWrap = false,
                                            fontWeight = if (priority == p) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    modifier = Modifier.weight(1f).heightIn(min = 44.dp)
                                )
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Daily Reminder Notification",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "Receive prompt at scheduled routine time",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Switch(
                                    checked = reminderEnabled,
                                    onCheckedChange = { reminderEnabled = it }
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                // Fixed Action Footer
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 48.dp)
                            .testTag("cancel_routine_button")
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            if (isSaving) return@Button
                            if (name.isBlank()) {
                                nameError = "Routine name is required"
                                return@Button
                            }
                            val targetVal = targetValueText.toDoubleOrNull()
                            if (taskType != TaskType.CHECKBOX && (targetVal == null || targetVal <= 0.0)) {
                                targetValueError = "Valid positive target required"
                                return@Button
                            }

                            isSaving = true
                            val daysStr = frequencyDays.sorted().joinToString(",")

                            val routine = Routine(
                                id = initialRoutine?.id ?: 0L,
                                name = name.trim(),
                                description = description.trim(),
                                category = category,
                                linkedGoalId = linkedGoalId,
                                startDate = initialRoutine?.startDate ?: LocalDate.now().format(ProgressCalculationEngine.DATE_FORMATTER),
                                endDate = initialRoutine?.endDate,
                                timeHour = timeHour,
                                timeMinute = timeMinute,
                                durationMinutes = durationMinutes,
                                frequency = frequency,
                                frequencyDays = if (daysStr.isBlank()) "1,2,3,4,5,6,7" else daysStr,
                                weeklyTargetTimes = weeklyTargetTimes,
                                taskType = taskType,
                                targetValue = targetVal ?: 1.0,
                                unit = unit.trim(),
                                priority = priority,
                                reminderEnabled = reminderEnabled,
                                isPaused = initialRoutine?.isPaused ?: false,
                                createdAt = initialRoutine?.createdAt ?: System.currentTimeMillis()
                            )
                            onSave(routine)
                        },
                        enabled = !isSaving,
                        modifier = Modifier
                            .weight(1.5f)
                            .heightIn(min = 48.dp)
                            .testTag("save_routine_button")
                    ) {
                        Text(
                            text = if (isEdit) "Save Changes" else "Create Routine",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

