package com.example.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.DailyReflection
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun DailyReflectionDialog(
    date: LocalDate,
    existingReflection: DailyReflection?,
    onDismiss: () -> Unit,
    onSave: (rating: Int, wentWell: String, couldImprove: String, notes: String) -> Unit
) {
    var rating by remember { mutableIntStateOf(existingReflection?.rating ?: 5) }
    var wentWell by remember { mutableStateOf(existingReflection?.wentWell ?: "") }
    var couldImprove by remember { mutableStateOf(existingReflection?.couldImprove ?: "") }
    var notes by remember { mutableStateOf(existingReflection?.notes ?: "") }

    val dateFormatted = date.format(DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy"))

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "Daily Reflection",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = dateFormatted,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // 1 to 5 Star Rating
                Text(
                    text = "How was your day? ($rating / 5)",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    for (star in 1..5) {
                        IconButton(
                            onClick = { rating = star },
                            modifier = Modifier.testTag("reflection_star_$star")
                        ) {
                            Icon(
                                imageVector = if (star <= rating) Icons.Filled.Star else Icons.Outlined.StarBorder,
                                contentDescription = "$star stars",
                                tint = if (star <= rating) Color(0xFFFBBF24) else MaterialTheme.colorScheme.outlineVariant,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = wentWell,
                    onValueChange = { wentWell = it },
                    label = { Text("What went well today?") },
                    placeholder = { Text("Wins, completed routines, focus...") },
                    maxLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("reflection_went_well_input")
                )

                OutlinedTextField(
                    value = couldImprove,
                    onValueChange = { couldImprove = it },
                    label = { Text("What could be improved?") },
                    placeholder = { Text("Distractions, energy levels, obstacles...") },
                    maxLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("reflection_could_improve_input")
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("General Thoughts / Notes") },
                    maxLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("reflection_notes_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(rating, wentWell.trim(), couldImprove.trim(), notes.trim()) },
                modifier = Modifier.testTag("save_reflection_button")
            ) {
                Text("Save Reflection")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("cancel_reflection_button")
            ) {
                Text("Cancel")
            }
        }
    )
}
