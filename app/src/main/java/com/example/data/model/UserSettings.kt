package com.example.data.model

data class UserSettings(
    val themeMode: String = "SYSTEM", // SYSTEM, LIGHT, DARK
    val is24HourFormat: Boolean = false,
    val startDayOfWeek: Int = 1, // 1 = Monday, 7 = Sunday
    val remindersEnabled: Boolean = true,
    val eveningReminderEnabled: Boolean = true,
    val eveningReminderTime: String = "20:00" // 8:00 PM
)
