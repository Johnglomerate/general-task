package external

import (
	"errors"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
)

func TestEmptyCalendarResult(t *testing.T) {
	err := errors.New("example error")
	result := emptyCalendarResult(err)
	assert.Equal(t, result.CalendarEvents, []*database.CalendarEvent{})
	assert.Equal(t, result.Error, err)
}

func TestEmptyTaskResult(t *testing.T) {
	err := errors.New("example error")
	result := emptyTaskResult(err)
	assert.Equal(t, result.Tasks, []*database.Task{})
	assert.Equal(t, result.Error, err)
}
