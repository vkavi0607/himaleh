package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.data.model.Routine
import com.example.data.model.TaskType

@Composable
fun CompleteMeasurableDialog(
    routine: Routine,
    onDismiss: () -> Unit,
    onConfirm: (value: Double, notes: String) -> Unit
) {
    var valueText by remember { mutableStateOf(routine.targetValue.toString().removeSuffix(".0")) }
    var notes by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val promptLabel = when (routine.taskType) {
        TaskType.DURATION -> "Duration (${if (routine.unit.isBlank()) "minutes" else routine.unit})"
        TaskType.QUANTITY -> "Quantity (${if (routine.unit.isBlank()) "units" else routine.unit})"
        TaskType.COUNT -> "Count (${if (routine.unit.isBlank()) "reps" else routine.unit})"
        TaskType.TIME_BASED -> "Check-in Value"
        else -> "Value"
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "Record Progress",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = routine.name,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = valueText,
                    onValueChange = {
                        valueText = it
                        errorMessage = null
                    },
                    label = { Text(promptLabel) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = errorMessage != null,
                    supportingText = errorMessage?.let { { Text(it) } },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("measurable_input_field")
                )

                // Quick Increment Chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val currentVal = valueText.toDoubleOrNull() ?: 0.0
                    listOf(1, 5, 10, 20).forEach { inc ->
                        AssistChip(
                            onClick = {
                                val newVal = (currentVal + inc).coerceAtLeast(0.0)
                                valueText = if (newVal % 1.0 == 0.0) newVal.toInt().toString() else newVal.toString()
                            },
                            label = { Text("+$inc") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Optional Notes") },
                    maxLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("measurable_notes_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val parsed = valueText.toDoubleOrNull()
                    if (parsed == null || parsed <= 0.0) {
                        errorMessage = "Please enter a valid positive number"
                    } else {
                        onConfirm(parsed, notes.trim())
                    }
                },
                modifier = Modifier.testTag("confirm_measurable_button")
            ) {
                Text("Save Progress")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("cancel_measurable_button")
            ) {
                Text("Cancel")
            }
        }
    )
}
