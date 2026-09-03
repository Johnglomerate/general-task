package constants

type ViewType string

const (
	ViewMeetingPreparationName = "Meeting Preparation"
	ViewDueTodayName           = "Due Today"
)

const (
	ViewTaskSection        ViewType = "task_section"
	ViewMeetingPreparation ViewType = "meeting_preparation"
	ViewDueToday           ViewType = "due_today"
)

// RetiredViewTypes are view types that existing accounts may still have rows for
// but that the API no longer knows how to render. Views of these types are
// skipped rather than treated as corrupt, so a user whose data predates the
// removal still gets an overview instead of a 500.
var RetiredViewTypes = []string{"github", "jira", "linear", "slack"}

const (
	MAX_OVERVIEW_SUGGESTION int = 5
)

const (
	ShowMovedOrDeleted       = "show_moved_or_deleted"
	IgnoreMeetingPreparation = "ignore_meeting_preparation"
)
