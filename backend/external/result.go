package external

import "github.com/GeneralTask/task-manager/backend/database"

type CalendarResult struct {
	CalendarEvents []*database.CalendarEvent
	Error          error
}

type TaskResult struct {
	Tasks     []*database.Task
	Error     error
	SourceID  string
	ServiceID string
	AccountID string
}

func emptyCalendarResult(err error) CalendarResult {
	return CalendarResult{
		CalendarEvents: []*database.CalendarEvent{},
		Error:          err,
	}
}

func emptyTaskResult(err error) TaskResult {
	return TaskResult{
		Tasks: []*database.Task{},
		Error: err,
	}
}
