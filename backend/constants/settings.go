package constants

const (
	// Shared sorting choices
	ChoiceKeyCreatedAt  = "created_at"
	ChoiceKeyUpdatedAt  = "updated_at"
	ChoiceKeyDescending = "descending"
	ChoiceKeyAscending  = "ascending"
	// Task sorting
	SettingFieldTaskSortingPreference = "task_sorting_preference"
	SettingFieldTaskSortingDirection  = "task_sorting_direction"
	ChoiceKeyManual                   = "manual"
	ChoiceKeyDueDate                  = "due_date"
	ChoiceKeyPriority                 = "priority"
	// Note sorting and filtering
	SettingFieldNoteSortingPreference   = "note_sorting_preference"
	SettingFieldNoteSortingDirection    = "note_sorting_direction"
	SettingFieldNoteFilteringPreference = "note_filtering_preference"
	ChoiceKeyNoDeleted                  = "no_deleted"
	ChoiceKeyShowDeleted                = "show_deleted"
	// Recurring task filtering
	SettingFieldRecurringTaskFilteringPreference = "recurring_task_filtering_preference"
	// Calendar choice
	SettingFieldCalendarForNewTasks   = "calendar_account_id_for_new_tasks"
	SettingFieldCalendarIDForNewTasks = "calendar_calendar_id_for_new_tasks"
	// Overview page settings
	SettingCollapseEmptyLists     = "collapse_empty_lists"
	SettingMoveEmptyListsToBottom = "move_empty_lists_to_bottom"
	// Lab settings
	LabSmartPrioritizeEnabled = "lab_smart_prioritize_enabled"
	// Misc settings
	HasDismissedMulticalPrompt = "has_dismissed_multical_prompt"
)

const (
	SettingFalse = "false"
)
