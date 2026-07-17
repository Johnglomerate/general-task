package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// revokeTestServer stands in for Google's revocation endpoint and records the
// tokens it was asked to revoke.
func revokeTestServer(statusCode int) (*httptest.Server, *[]string) {
	revoked := []string{}
	var mutex sync.Mutex
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		mutex.Lock()
		revoked = append(revoked, r.Form.Get("token"))
		mutex.Unlock()
		w.WriteHeader(statusCode)
	}))
	return server, &revoked
}

func TestDeleteAccount(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		server, revoked := revokeTestServer(http.StatusOK)
		defer server.Close()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		api.ExternalConfig.GoogleOverrideURLs.RevokeURL = &server.URL

		authToken := login("deleteaccount@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		// A second user whose data must survive the first user's deletion.
		otherAuthToken := login("deleteaccount_other@generaltask.com", "")
		otherUserID := getUserIDFromAuthToken(t, api.DB, otherAuthToken)

		title := "meeting with the team"
		insertTask := func(id primitive.ObjectID) primitive.ObjectID {
			res, err := database.GetTaskCollection(api.DB).InsertOne(context.Background(), &database.Task{UserID: id, Title: &title})
			assert.NoError(t, err)
			return res.InsertedID.(primitive.ObjectID)
		}
		insertEvent := func(id primitive.ObjectID) primitive.ObjectID {
			res, err := database.GetCalendarEventCollection(api.DB).InsertOne(context.Background(), &database.CalendarEvent{
				UserID:         id,
				Title:          title,
				Body:           "agenda",
				AttendeeEmails: []string{"someone@example.com"},
			})
			assert.NoError(t, err)
			return res.InsertedID.(primitive.ObjectID)
		}
		insertNote := func(id primitive.ObjectID) primitive.ObjectID {
			res, err := database.GetNoteCollection(api.DB).InsertOne(context.Background(), &database.Note{UserID: id, Title: &title})
			assert.NoError(t, err)
			return res.InsertedID.(primitive.ObjectID)
		}

		taskID := insertTask(userID)
		eventID := insertEvent(userID)
		noteID := insertNote(userID)
		otherTaskID := insertTask(otherUserID)
		otherEventID := insertEvent(otherUserID)
		otherNoteID := insertNote(otherUserID)

		ServeRequest(t, authToken, "DELETE", "/user/", nil, http.StatusOK, api)

		// The Google grant is revoked using the refresh token that login() stored.
		assert.Equal(t, []string{"test123"}, *revoked)

		assertGone := func(collection string, id primitive.ObjectID) {
			count, err := api.DB.Collection(collection).CountDocuments(context.Background(), bson.M{"_id": id})
			assert.NoError(t, err)
			assert.Equal(t, int64(0), count, collection+" was not deleted")
		}
		assertPresent := func(collection string, id primitive.ObjectID) {
			count, err := api.DB.Collection(collection).CountDocuments(context.Background(), bson.M{"_id": id})
			assert.NoError(t, err)
			assert.Equal(t, int64(1), count, collection+" should not have been deleted")
		}

		assertGone("tasks", taskID)
		assertGone("calendar_events", eventID)
		assertGone("notes", noteID)

		// The user, their credentials, and their session are all gone.
		count, err := database.GetUserCollection(api.DB).CountDocuments(context.Background(), bson.M{"_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		count, err = database.GetExternalTokenCollection(api.DB).CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		count, err = database.GetInternalTokenCollection(api.DB).CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		// The other user is untouched.
		assertPresent("tasks", otherTaskID)
		assertPresent("calendar_events", otherEventID)
		assertPresent("notes", otherNoteID)
		count, err = database.GetUserCollection(api.DB).CountDocuments(context.Background(), bson.M{"_id": otherUserID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})

	t.Run("SessionNoLongerValid", func(t *testing.T) {
		server, _ := revokeTestServer(http.StatusOK)
		defer server.Close()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		api.ExternalConfig.GoogleOverrideURLs.RevokeURL = &server.URL

		authToken := login("deleteaccount_session@generaltask.com", "")
		ServeRequest(t, authToken, "DELETE", "/user/", nil, http.StatusOK, api)

		// The deleted session token must not authenticate anything afterwards.
		ServeRequest(t, authToken, "GET", "/ping_authed/", nil, http.StatusUnauthorized, api)
	})

	t.Run("RevocationFailureStillDeletes", func(t *testing.T) {
		// Google being unreachable must not strand a user who asked to be deleted.
		server, _ := revokeTestServer(http.StatusInternalServerError)
		defer server.Close()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		api.ExternalConfig.GoogleOverrideURLs.RevokeURL = &server.URL

		authToken := login("deleteaccount_revokefail@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		ServeRequest(t, authToken, "DELETE", "/user/", nil, http.StatusOK, api)

		count, err := database.GetUserCollection(api.DB).CountDocuments(context.Background(), bson.M{"_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})

	UnauthorizedTest(t, "DELETE", "/user/", nil)
}
