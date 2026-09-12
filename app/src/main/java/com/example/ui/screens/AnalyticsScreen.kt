package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.domain.DailyProgressResult
import com.example.domain.ProgressCalculationEngine
import com.example.ui.theme.EmeraldSuccess
import com.example.ui.theme.FlameOrange
import com.example.ui.theme.IndigoLight
import com.example.ui.theme.RoseDanger
import com.example.ui.viewmodel.MainUiState
import com.example.ui.viewmodel.MainViewModel
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun AnalyticsScreen(
    viewModel: MainViewModel,
    uiState: MainUiState
) {
    var selectedHeatmapDate by remember { mutableStateOf<LocalDate?>(null) }
    var currentMonth by remember { mutableStateOf(YearMonth.now()) }

    val today = LocalDate.now()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 80.dp)
    ) {
        // 1. Consistency Overview Metric Cards
        item {
            Text(
                text = "Consistency & Streak Analytics",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "Current Streak",
                    value = "🔥 ${uiState.streakStats.currentStreak}d",
                    subtitle = "Personal best: ${uiState.streakStats.longestStreak}d",
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "7-Day Consistency",
                    value = "${uiState.streakStats.weeklyConsistency.toInt()}%",
                    subtitle = "Target: ≥ 80%",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "30-Day Consistency",
                    value = "${uiState.streakStats.monthlyConsistency.toInt()}%",
                    subtitle = "${uiState.streakStats.totalCompletedDays} successful days",
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "All-Time Consistency",
                    value = "${uiState.streakStats.overallConsistency.toInt()}%",
                    subtitle = "Historical qualifying rate",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 2. Past 7 Days Visual Completion Chart (Compose Canvas)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Past 7 Days Performance",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    // Calculate past 7 days %
                    val past7Days = (6 downTo 0).map { today.minusDays(it.toLong()) }
                    val past7Progress = past7Days.map { date ->
                        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
                        val logs = uiState.allLogs.filter { it.date == dateStr }
                        val prog = ProgressCalculationEngine.calculateDailyProgress(
                            routines = uiState.routines,
                            logsForDate = logs,
                            allLogs = uiState.allLogs,
                            date = date
                        )
                        Triple(date, prog.completionPercentage ?: 100.0, prog.totalPlanned)
                    }

                    WeeklyTrendChart(data = past7Progress)
                }
            }
        }

        // 3. Consistency Heatmap / Calendar
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${currentMonth.month.getDisplayName(TextStyle.FULL, Locale.getDefault())} ${currentMonth.year}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Row {
                            TextButton(onClick = { currentMonth = currentMonth.minusMonths(1) }) {
                                Text("< Prev")
                            }
                            TextButton(onClick = { currentMonth = currentMonth.plusMonths(1) }) {
                                Text("Next >")
                            }
                        }
                    }

                    // Weekday headers (M, T, W, T, F, S, S)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        listOf("M", "T", "W", "T", "F", "S", "S").forEach { day ->
                            Text(
                                text = day,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.width(32.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    // Month Grid
                    ConsistencyMonthGrid(
                        yearMonth = currentMonth,
                        uiState = uiState,
                        onDateSelected = { selectedHeatmapDate = it }
                    )

                    // Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        LegendItem(color = EmeraldSuccess, label = "100%")
                        Spacer(modifier = Modifier.width(8.dp))
                        LegendItem(color = IndigoLight, label = "≥50%")
                        Spacer(modifier = Modifier.width(8.dp))
                        LegendItem(color = FlameOrange, label = "<50%")
                        Spacer(modifier = Modifier.width(8.dp))
                        LegendItem(color = RoseDanger, label = "Missed")
                        Spacer(modifier = Modifier.width(8.dp))
                        LegendItem(color = MaterialTheme.colorScheme.surfaceVariant, label = "Rest")
                    }
                }
            }
        }

        // Selected Date Breakdown (if user clicked a day on the calendar)
        if (selectedHeatmapDate != null) {
            val date = selectedHeatmapDate!!
            val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
            val logsForDate = uiState.allLogs.filter { it.date == dateStr }
            val dailyProgress = ProgressCalculationEngine.calculateDailyProgress(
                routines = uiState.routines,
                logsForDate = logsForDate,
                allLogs = uiState.allLogs,
                date = date
            )
            val reflection = uiState.allReflections.find { it.date == dateStr }

            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
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
                            Text(
                                text = date.format(java.time.format.DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy")),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            TextButton(onClick = { selectedHeatmapDate = null }) {
                                Text("Dismiss")
                            }
                        }

                        Text(
                            text = if (dailyProgress.totalPlanned == 0) "Rest day • No planned routines" else "${dailyProgress.completedCount} / ${dailyProgress.totalPlanned} completed (${dailyProgress.completionPercentage?.toInt() ?: 0}%)",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        if (reflection != null) {
                            Text(
                                text = "Reflection: ${reflection.rating}/5 stars • \"${reflection.wentWell}\"",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        // Button to switch main dashboard to this date
                        Button(
                            onClick = {
                                viewModel.setSelectedDate(date)
                            },
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text("Open in Dashboard")
                        }
                    }
                }
            }
        }

        // 4. Missed Routine Insights Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Accountability & Missed Insights",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (uiState.missedInsights.isEmpty()) {
                        Text(
                            text = "No negative habit drop-off patterns detected over the past 8 weeks. Keep maintaining your momentum!",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            uiState.missedInsights.forEach { insight ->
                                Surface(
                                    color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f),
                                    shape = MaterialTheme.shapes.small,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "⚠️ ${insight.message}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        modifier = Modifier.padding(10.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. Recent Reflections Summary
        if (uiState.allReflections.isNotEmpty()) {
            item {
                Text(
                    text = "Recent Daily Reflections",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            items(uiState.allReflections.take(5)) { ref ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = ref.date,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Row {
                                for (i in 1..ref.rating) {
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = null,
                                        tint = Color(0xFFFBBF24),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                        if (ref.wentWell.isNotBlank()) {
                            Text(
                                text = "Went well: ${ref.wentWell}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        if (ref.couldImprove.isNotBlank()) {
                            Text(
                                text = "To improve: ${ref.couldImprove}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    modifier: Modifier = Modifier
) {
    Card(
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun WeeklyTrendChart(data: List<Triple<LocalDate, Double, Int>>) {
    val barColor = MaterialTheme.colorScheme.primary
    val trackColor = MaterialTheme.colorScheme.surfaceVariant

    Column(modifier = Modifier.fillMaxWidth()) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(110.dp)
        ) {
            val count = data.size
            if (count == 0) return@Canvas
            val barWidth = size.width / (count * 2f)
            val spacing = size.width / count

            for (i in 0 until count) {
                val (_, pct, totalPlanned) = data[i]
                val x = (i * spacing) + (spacing - barWidth) / 2f
                val height = size.height * 0.85f

                // Draw background track
                drawRoundRect(
                    color = trackColor,
                    topLeft = Offset(x, 0f),
                    size = Size(barWidth, height),
                    cornerRadius = CornerRadius(8f, 8f)
                )

                // Draw filled bar
                if (totalPlanned > 0) {
                    val fillHeight = (height * (pct / 100.0)).toFloat().coerceIn(0f, height)
                    drawRoundRect(
                        color = barColor,
                        topLeft = Offset(x, height - fillHeight),
                        size = Size(barWidth, fillHeight),
                        cornerRadius = CornerRadius(8f, 8f)
                    )
                }
            }
        }

        // Labels under bars
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            data.forEach { (date, _, _) ->
                Text(
                    text = date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(3),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun ConsistencyMonthGrid(
    yearMonth: YearMonth,
    uiState: MainUiState,
    onDateSelected: (LocalDate) -> Unit
) {
    val firstDay = yearMonth.atDay(1)
    val totalDays = yearMonth.lengthOfMonth()
    val today = LocalDate.now()

    // 1=Mon, 7=Sun
    val leadingBlanks = firstDay.dayOfWeek.value - 1

    val daysList = mutableListOf<LocalDate?>()
    for (i in 0 until leadingBlanks) {
        daysList.add(null)
    }
    for (d in 1..totalDays) {
        daysList.add(yearMonth.atDay(d))
    }

    val weeks = daysList.chunked(7)

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        for (week in weeks) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                for (i in 0..6) {
                    val date = week.getOrNull(i)
                    if (date != null) {
                        val dateStr = date.format(ProgressCalculationEngine.DATE_FORMATTER)
                        val logs = uiState.allLogs.filter { it.date == dateStr }
                        val dailyProg = ProgressCalculationEngine.calculateDailyProgress(
                            routines = uiState.routines,
                            logsForDate = logs,
                            allLogs = uiState.allLogs,
                            date = date
                        )

                        val cellColor = when {
                            dailyProg.totalPlanned == 0 -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                            dailyProg.completionPercentage == 100.0 -> EmeraldSuccess
                            (dailyProg.completionPercentage ?: 0.0) >= 50.0 -> IndigoLight
                            (dailyProg.completionPercentage ?: 0.0) > 0.0 -> FlameOrange
                            else -> if (date.isBefore(today)) RoseDanger else MaterialTheme.colorScheme.surfaceVariant
                        }

                        val isCurrentDay = date == today

                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(MaterialTheme.shapes.small)
                                .background(cellColor)
                                .then(
                                    if (isCurrentDay) Modifier.border(2.dp, MaterialTheme.colorScheme.primary, MaterialTheme.shapes.small)
                                    else Modifier
                                )
                                .clickable { onDateSelected(date) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = date.dayOfMonth.toString(),
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = if (isCurrentDay) FontWeight.Bold else FontWeight.Normal,
                                color = if (dailyProg.totalPlanned > 0 && dailyProg.completionPercentage != null && dailyProg.completionPercentage > 0.0) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.size(36.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun LegendItem(color: Color, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(text = label, style = MaterialTheme.typography.labelSmall)
    }
}
