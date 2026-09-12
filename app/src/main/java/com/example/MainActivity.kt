package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.ui.components.*
import com.example.ui.screens.*
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.MainViewModel

enum class ScreenNav(val route: String, val title: String, val testTag: String) {
    DASHBOARD("dashboard", "Dashboard", "nav_dashboard"),
    ROUTINES("routines", "Routines", "nav_routines"),
    GOALS("goals", "Goals", "nav_goals"),
    ANALYTICS("analytics", "Analytics", "nav_analytics"),
    SETTINGS("settings", "Settings", "nav_settings")
}

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            // Resolve theme mode
            val isDark = when (uiState.settings.themeMode) {
                "LIGHT" -> false
                "DARK" -> true
                else -> isSystemInDarkTheme()
            }

            MyApplicationTheme(darkTheme = isDark) {
                HimalehApp(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HimalehApp(viewModel: MainViewModel) {
    val navController = rememberNavController()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    // Request notification permission for Android 13+
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { _ -> }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permissionCheck = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            )
            if (permissionCheck != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    // Show feedback snackbar
    LaunchedEffect(uiState.userFeedbackMessage) {
        val msg = uiState.userFeedbackMessage
        if (msg != null) {
            snackbarHostState.showSnackbar(msg)
            viewModel.clearFeedbackMessage()
        }
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: ScreenNav.DASHBOARD.route

    // Dialog state collectors
    val isAddRoutineDialogOpen by viewModel.isAddRoutineDialogOpen.collectAsStateWithLifecycle()
    val editingRoutine by viewModel.editingRoutine.collectAsStateWithLifecycle()
    val isQuickAddSheetOpen by viewModel.isQuickAddSheetOpen.collectAsStateWithLifecycle()

    val isAddGoalDialogOpen by viewModel.isAddGoalDialogOpen.collectAsStateWithLifecycle()
    val editingGoal by viewModel.editingGoal.collectAsStateWithLifecycle()
    val viewingGoalDetails by viewModel.viewingGoalDetails.collectAsStateWithLifecycle()

    val completingRoutineForMeasurement by viewModel.completingRoutineForMeasurement.collectAsStateWithLifecycle()
    val reschedulingRoutine by viewModel.reschedulingRoutine.collectAsStateWithLifecycle()
    val isReflectionDialogOpen by viewModel.isReflectionDialogOpen.collectAsStateWithLifecycle()

    // 1. Add/Edit Routine Dialog
    if (isAddRoutineDialogOpen) {
        AddEditRoutineDialog(
            initialRoutine = editingRoutine,
            goals = uiState.goals,
            onDismiss = {
                viewModel.isAddRoutineDialogOpen.value = false
                viewModel.editingRoutine.value = null
            },
            onSave = { routine ->
                viewModel.saveRoutine(routine)
            }
        )
    }

    // 2. Quick Add Routine BottomSheet
    if (isQuickAddSheetOpen) {
        QuickAddRoutineSheet(
            onDismiss = { viewModel.isQuickAddSheetOpen.value = false },
            onSave = { routine ->
                viewModel.saveRoutine(routine)
            }
        )
    }

    // 3. Add/Edit Goal Dialog
    if (isAddGoalDialogOpen) {
        AddEditGoalDialog(
            initialGoal = editingGoal,
            onDismiss = {
                viewModel.isAddGoalDialogOpen.value = false
                viewModel.editingGoal.value = null
            },
            onSave = { goal, createMilestones ->
                viewModel.saveGoal(goal, createMilestones)
            }
        )
    }

    // 4. Goal Details Dialog
    if (viewingGoalDetails != null) {
        val goal = viewingGoalDetails!!
        val progress = uiState.goalProgressList.find { it.goalId == goal.id }
        val linkedRoutines = uiState.routines.filter { it.linkedGoalId == goal.id }
        GoalDetailsDialog(
            goal = goal,
            progress = progress,
            linkedRoutines = linkedRoutines,
            onDismiss = { viewModel.viewingGoalDetails.value = null },
            onEdit = {
                viewModel.viewingGoalDetails.value = null
                viewModel.editingGoal.value = goal
                viewModel.isAddGoalDialogOpen.value = true
            },
            onDelete = {
                viewModel.deleteGoal(goal)
            },
            onStatusChange = { newStatus ->
                viewModel.updateGoalStatus(goal.id, newStatus)
            }
        )
    }

    // 5. Complete Measurable Routine Dialog
    if (completingRoutineForMeasurement != null) {
        val routine = completingRoutineForMeasurement!!
        CompleteMeasurableDialog(
            routine = routine,
            onDismiss = { viewModel.completingRoutineForMeasurement.value = null },
            onConfirm = { value, notes ->
                viewModel.completeMeasurableRoutine(
                    routine = routine,
                    date = uiState.selectedDate,
                    value = value,
                    notes = notes
                )
            }
        )
    }

    // 6. Reschedule Routine Dialog
    if (reschedulingRoutine != null) {
        val routine = reschedulingRoutine!!
        RescheduleDialog(
            routine = routine,
            currentDate = uiState.selectedDate,
            onDismiss = { viewModel.reschedulingRoutine.value = null },
            onConfirm = { targetDate ->
                viewModel.rescheduleRoutine(
                    routine = routine,
                    fromDate = uiState.selectedDate,
                    toDate = targetDate
                )
            }
        )
    }

    // 7. Daily Reflection Dialog
    if (isReflectionDialogOpen) {
        DailyReflectionDialog(
            date = uiState.selectedDate,
            existingReflection = uiState.selectedDateReflection,
            onDismiss = { viewModel.isReflectionDialogOpen.value = false },
            onSave = { rating, wentWell, couldImprove, notes ->
                viewModel.saveReflection(
                    date = uiState.selectedDate,
                    rating = rating,
                    wentWell = wentWell,
                    couldImprove = couldImprove,
                    notes = notes
                )
            }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            NavigationBar(
                modifier = Modifier.testTag("main_bottom_nav")
            ) {
                ScreenNav.entries.forEach { screen ->
                    val isSelected = currentRoute == screen.route
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = {
                            if (currentRoute != screen.route) {
                                navController.navigate(screen.route) {
                                    popUpTo(ScreenNav.DASHBOARD.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = when (screen) {
                                    ScreenNav.DASHBOARD -> Icons.Default.Dashboard
                                    ScreenNav.ROUTINES -> Icons.Default.Repeat
                                    ScreenNav.GOALS -> Icons.Default.Flag
                                    ScreenNav.ANALYTICS -> Icons.Default.BarChart
                                    ScreenNav.SETTINGS -> Icons.Default.Settings
                                },
                                contentDescription = screen.title
                            )
                        },
                        label = { Text(screen.title) },
                        modifier = Modifier.testTag(screen.testTag)
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = ScreenNav.DASHBOARD.route,
                modifier = Modifier.fillMaxSize()
            ) {
                composable(ScreenNav.DASHBOARD.route) {
                    DashboardScreen(
                        viewModel = viewModel,
                        uiState = uiState,
                        onNavigateToGoals = {
                            navController.navigate(ScreenNav.GOALS.route)
                        }
                    )
                }
                composable(ScreenNav.ROUTINES.route) {
                    RoutinesScreen(
                        viewModel = viewModel,
                        uiState = uiState
                    )
                }
                composable(ScreenNav.GOALS.route) {
                    GoalsScreen(
                        viewModel = viewModel,
                        uiState = uiState
                    )
                }
                composable(ScreenNav.ANALYTICS.route) {
                    AnalyticsScreen(
                        viewModel = viewModel,
                        uiState = uiState
                    )
                }
                composable(ScreenNav.SETTINGS.route) {
                    SettingsScreen(
                        viewModel = viewModel,
                        uiState = uiState
                    )
                }
            }
        }
    }
}
