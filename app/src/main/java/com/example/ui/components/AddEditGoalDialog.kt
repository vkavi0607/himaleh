package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Flag
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
import com.example.data.model.Goal
import com.example.data.model.GoalPriority
import com.example.data.model.GoalStatus
import com.example.domain.ProgressCalculationEngine
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditGoalDialog(
    initialGoal: Goal?,
    onDismiss: () -> Unit,
    onSave: (goal: Goal, createMilestones: Boolean) -> Unit
) {
    val isEdit = initialGoal != null
    val today = LocalDate.now()

    var title by remember { mutableStateOf(initialGoal?.title ?: "") }
    var description by remember { mutableStateOf(initialGoal?.description ?: "") }
    var category by remember { mutableStateOf(initialGoal?.category ?: "Personal") }
    var targetValueText by remember {
        mutableStateOf(if (initialGoal != null) initialGoal.targetValue.toString().removeSuffix(".0") else "100")
    }
    var unit by remember { mutableStateOf(initialGoal?.unit ?: "%") }
    var priority by remember { mutableStateOf(initialGoal?.priority ?: GoalPriority.MEDIUM) }
    var motivation by remember { mutableStateOf(initialGoal?.motivation ?: "") }
    var createMilestones by remember { mutableStateOf(!isEdit) }

    var durationMonths by remember { mutableIntStateOf(3) }
    var targetEndDate by remember {
        mutableStateOf(
            if (initialGoal != null) {
                try {
                    LocalDate.parse(initialGoal.endDate, ProgressCalculationEngine.DATE_FORMATTER)
                } catch (e: Exception) {
                    today.plusMonths(3)
                }
            } else today.plusMonths(3)
        )
    }

    var titleError by remember { mutableStateOf<String?>(null) }
    var targetValueError by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    val categories = listOf("Personal", "Fitness", "Career", "Financial", "Education", "Mindset")
    val timelinePresets = listOf(1 to "1 Mo", 3 to "3 Mo", 6 to "6 Mo", 12 to "1 Yr")
    val priorities = listOf(
        GoalPriority.LOW to "Low",
        GoalPriority.MEDIUM to "Medium",
        GoalPriority.HIGH to "High"
    )

    val displayDateFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy")

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
                                    imageVector = Icons.Default.Flag,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Column {
                            Text(
                                text = if (isEdit) "Edit Goal" else "New Goal",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (isEdit) "Update target & timeline" else "Set a measurable milestone",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("close_goal_dialog_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                // Scrollable Form Body
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f, fill = false)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // SECTION 1: BASIC INFORMATION
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Basic Information",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = title,
                            onValueChange = {
                                title = it
                                titleError = null
                            },
                            label = { Text("Goal Title *") },
                            placeholder = { Text("e.g. Read 24 Books, Run Half Marathon") },
                            singleLine = true,
                            isError = titleError != null,
                            supportingText = titleError?.let { { Text(it) } },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("goal_title_input")
                        )

                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Description & Specifics") },
                            placeholder = { Text("What specific results or habits define success?") },
                            minLines = 2,
                            maxLines = 4,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("goal_desc_input")
                        )

                        OutlinedTextField(
                            value = motivation,
                            onValueChange = { motivation = it },
                            label = { Text("Motivation (Your 'Why')") },
                            placeholder = { Text("Why does this goal matter to you? Remind yourself on hard days.") },
                            minLines = 2,
                            maxLines = 4,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("goal_motivation_input")
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 2: GOAL SETUP
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Goal Setup",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Text(
                            text = "Category",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        // Responsive 2-column Category Grid
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

                        // Target Value and Unit
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
                                label = { Text("Target Value *") },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                isError = targetValueError != null,
                                supportingText = targetValueError?.let { { Text(it) } },
                                modifier = Modifier
                                    .weight(1.2f)
                                    .testTag("goal_target_input")
                            )

                            OutlinedTextField(
                                value = unit,
                                onValueChange = { unit = it },
                                label = { Text("Unit") },
                                placeholder = { Text("e.g. %, Hours, Books, Km") },
                                singleLine = true,
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("goal_unit_input")
                            )
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 3: TIMELINE
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Timeline & Deadlines",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Text(
                            text = "Target Timeline",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        // Responsive 2x2 Timeline Grid: 1 Mo, 3 Mo / 6 Mo, 1 Yr
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            timelinePresets.chunked(2).forEach { rowPresets ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    rowPresets.forEach { (months, label) ->
                                        FilterChip(
                                            selected = durationMonths == months,
                                            onClick = {
                                                durationMonths = months
                                                targetEndDate = today.plusMonths(months.toLong())
                                            },
                                            label = {
                                                Text(
                                                    text = label,
                                                    maxLines = 1,
                                                    softWrap = false,
                                                    fontWeight = if (durationMonths == months) FontWeight.Bold else FontWeight.Normal
                                                )
                                            },
                                            modifier = Modifier
                                                .weight(1f)
                                                .heightIn(min = 44.dp)
                                                .testTag("timeline_chip_$label")
                                        )
                                    }
                                }
                            }
                        }

                        // Dates summary surface
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
                                        imageVector = Icons.Default.CalendarToday,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "Start: ${today.format(displayDateFormatter)}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(
                                    text = "Target: ${targetEndDate.format(displayDateFormatter)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                    // SECTION 4: PRIORITY & MILESTONES
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "Priority & Milestones",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Text(
                            text = "Priority Level",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        // 3-column Priority Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            priorities.forEach { (p, label) ->
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
                                    modifier = Modifier
                                        .weight(1f)
                                        .heightIn(min = 44.dp)
                                        .testTag("priority_chip_$label")
                                )
                            }
                        }

                        if (!isEdit) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f),
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
                                            text = "Auto-Generate Milestones",
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "Creates 25%, 50%, 75%, and 100% checkpoints",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Checkbox(
                                        checked = createMilestones,
                                        onCheckedChange = { createMilestones = it }
                                    )
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                // Fixed Action Buttons Footer
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
                            .testTag("cancel_goal_button")
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            if (isSaving) return@Button
                            if (title.isBlank()) {
                                titleError = "Goal title is required"
                                return@Button
                            }
                            val targetVal = targetValueText.toDoubleOrNull()
                            if (targetVal == null || targetVal <= 0.0) {
                                targetValueError = "Valid positive target is required"
                                return@Button
                            }

                            isSaving = true

                            val startDate = initialGoal?.startDate ?: today.format(ProgressCalculationEngine.DATE_FORMATTER)
                            val endDate = initialGoal?.endDate ?: targetEndDate.format(ProgressCalculationEngine.DATE_FORMATTER)

                            val goal = Goal(
                                id = initialGoal?.id ?: 0L,
                                title = title.trim(),
                                description = description.trim(),
                                category = category,
                                startDate = startDate,
                                endDate = endDate,
                                priority = priority,
                                targetValue = targetVal,
                                unit = if (unit.isBlank()) "%" else unit.trim(),
                                motivation = motivation.trim(),
                                status = initialGoal?.status ?: GoalStatus.ACTIVE,
                                createdAt = initialGoal?.createdAt ?: System.currentTimeMillis()
                            )
                            onSave(goal, createMilestones)
                        },
                        enabled = !isSaving,
                        modifier = Modifier
                            .weight(1.5f)
                            .heightIn(min = 48.dp)
                            .testTag("save_goal_button")
                    ) {
                        Text(
                            text = if (isEdit) "Save Changes" else "Create Goal",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

