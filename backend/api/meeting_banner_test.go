package api

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMeetingBanner(t *testing.T) {
	authToken := login("approved@generaltask.com", "")

	UnauthorizedTest(t, "GET", "/meeting_banner/", nil)
	t.Run("Success", func(t *testing.T) {
		body := ServeRequest(t, authToken, "GET", "/meeting_banner/", nil, http.StatusOK, nil)
		assert.Equal(t, "{\"title\":\"Your next meeting is at 4:20pm\",\"subtitle\":\"It looks like you've got a little time before your next meeting (6.9 min)\",\"events\":[{\"title\":\"Blast off\",\"conference_call\":{\"platform\":\"Google Meet\",\"logo\":\"/images/google-meet.svg\",\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}}],\"actions\":[{\"logo\":\"gcal\",\"title\":\"Plan tomorrow's launch prep\",\"link\":\"https://calendar.google.com/\"},{\"logo\":\"gmail\",\"title\":\"Unread email: Ramp Daily Digest for May 12\",\"link\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"},{\"logo\":\"generaltask\",\"title\":\"Prioritize today's task list\",\"link\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}]}", string(body))
	})
}
