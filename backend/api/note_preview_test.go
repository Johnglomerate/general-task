package api

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestNotePreview(t *testing.T) {
	authToken := login("test_notes_preview@generaltask.com", "")

	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	userID := getUserIDFromAuthToken(t, db, authToken)
	note1, err := database.GetOrCreateNote(
		db,
		userID,
		"123abc",
		"foobar_source",
		&database.Note{
			Author: "Elon",
			UserID: userID,
		},
	)
	assert.NoError(t, err)
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	_ = note1
	router := GetRouter(api)

	expectedBody := `
<!DOCTYPE html>
<html>
<head>
	<title>Shared note unavailable</title>
	<meta property="og:title" content="Shared note unavailable" />
	<meta name="twitter:title" content="Shared note unavailable">
	<meta content="Shared notes are no longer available." property="og:description">
	<meta content="Shared notes are no longer available." property="twitter:description">
	<meta property="og:type" content="website" />
</head>
<body>
	Shared notes are no longer available.
</body>
</html>`

	t.Run("UnknownNoteID", func(t *testing.T) {
		invalidNoteID := primitive.NewObjectID().Hex()
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/note/%s/", invalidNoteID),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusGone, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, expectedBody, string(body))
	})
	t.Run("SharedNoteUnavailable", func(t *testing.T) {
		request, _ := http.NewRequest(
			"GET",
			fmt.Sprintf("/note/%s/", note1.ID.Hex()),
			nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusGone, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, expectedBody, string(body))
	})
}
