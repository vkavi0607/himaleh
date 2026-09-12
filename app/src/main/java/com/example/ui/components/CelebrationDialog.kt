package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlin.random.Random

sealed class CelebrationEvent {
    data class DailyComplete(
        val date: String,
        val totalRoutines: Int,
        val currentStreak: Int
    ) : CelebrationEvent()

    data class WeeklyComplete(
        val completedDays: Int,
        val targetDays: Int,
        val consistencyPct: Double
    ) : CelebrationEvent()

    data class GoalComplete(
        val goalId: Long,
        val goalTitle: String,
        val targetValue: Double,
        val unit: String
    ) : CelebrationEvent()
}

private data class ConfettiParticle(
    val initialX: Float,
    val speedY: Float,
    val amplitudeX: Float,
    val color: Color,
    val size: Float,
    val rotationSpeed: Float
)

@Composable
fun CelebrationDialog(
    event: CelebrationEvent,
    onDismiss: () -> Unit
) {
    // Pop-in scale animation
    var animationStarted by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (animationStarted) 1f else 0.7f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "celebration_pop"
    )

    LaunchedEffect(Unit) {
        animationStarted = true
    }

    // Confetti particles
    val particles = remember {
        val colors = listOf(
            Color(0xFFE91E63), Color(0xFF9C27B0), Color(0xFF2196F3),
            Color(0xFF4CAF50), Color(0xFFFF9800), Color(0xFFFFEB3B),
            Color(0xFF00BCD4), Color(0xFFE040FB)
        )
        val rnd = Random(42)
        List(45) {
            ConfettiParticle(
                initialX = rnd.nextFloat(),
                speedY = 0.5f + rnd.nextFloat() * 1.5f,
                amplitudeX = 0.05f + rnd.nextFloat() * 0.1f,
                color = colors[rnd.nextInt(colors.size)],
                size = 6f + rnd.nextFloat() * 8f,
                rotationSpeed = 1f + rnd.nextFloat() * 3f
            )
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "confetti_anim")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "confetti_progress"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(dismissOnBackPress = true, dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .scale(scale)
                .clip(RoundedCornerShape(24.dp))
                .background(MaterialTheme.colorScheme.surface)
                .testTag("celebration_dialog")
        ) {
            // Confetti canvas layer
            Canvas(
                modifier = Modifier
                    .matchParentSize()
                    .clip(RoundedCornerShape(24.dp))
            ) {
                val w = size.width
                val h = size.height
                for (p in particles) {
                    val y = ((progress * p.speedY + p.initialX) % 1f) * h
                    val x = (p.initialX * w) + kotlin.math.sin(progress * 6.28f * p.rotationSpeed) * (p.amplitudeX * w)
                    drawCircle(
                        color = p.color.copy(alpha = 0.75f),
                        radius = p.size,
                        center = Offset(x.coerceIn(0f, w), y)
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Icon Header
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(
                            when (event) {
                                is CelebrationEvent.DailyComplete -> MaterialTheme.colorScheme.tertiaryContainer
                                is CelebrationEvent.WeeklyComplete -> MaterialTheme.colorScheme.primaryContainer
                                is CelebrationEvent.GoalComplete -> MaterialTheme.colorScheme.secondaryContainer
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = when (event) {
                            is CelebrationEvent.DailyComplete -> "🎉"
                            is CelebrationEvent.WeeklyComplete -> "🏆"
                            is CelebrationEvent.GoalComplete -> "🎯"
                        },
                        fontSize = 36.sp
                    )
                }

                when (event) {
                    is CelebrationEvent.DailyComplete -> {
                        Text(
                            text = "Day Complete!",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = "100% of today's routines completed.",
                            style = MaterialTheme.typography.bodyLarge,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "🔥", fontSize = 20.sp)
                                Text(
                                    text = if (event.currentStreak > 1) {
                                        "${event.currentStreak} Day Streak! Keep it going!"
                                    } else {
                                        "Streak Started! Keep your streak going!"
                                    },
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer
                                )
                            }
                        }
                    }

                    is CelebrationEvent.WeeklyComplete -> {
                        Text(
                            text = "Weekly Goal Complete!",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = "${event.completedDays} / ${event.targetDays} days",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary,
                            textAlign = TextAlign.Center
                        )

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "🔥", fontSize = 20.sp)
                                Text(
                                    text = "Consistency maintained.",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }

                    is CelebrationEvent.GoalComplete -> {
                        Text(
                            text = "Goal Completed!",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = event.goalTitle,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            textAlign = TextAlign.Center
                        )

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.6f)
                        ) {
                            Text(
                                text = "100% Complete",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onTertiaryContainer,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            )
                        }

                        Text(
                            text = "Outstanding dedication! You've achieved your target of ${event.targetValue} ${event.unit}.",
                            style = MaterialTheme.typography.bodySmall,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("dismiss_celebration_button"),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Awesome!",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
