package api

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestSupportedAccountTypesList(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/supported_types/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.True(t, strings.Contains(string(body), "{\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"authorization_url\":\"http://localhost:8080/link/google/\"}"))
		assert.NotContains(t, string(body), "Slack")
		assert.NotContains(t, string(body), "Jira")
		assert.NotContains(t, string(body), "GitHub")
		assert.NotContains(t, string(body), "Linear")
	})
	UnauthorizedTest(t, "GET", "/linked_accounts/supported_types/", nil)
}

func TestLinkedAccountsList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	t.Run("SuccessOnlyGoogle", func(t *testing.T) {
		authToken := login("linkedaccounts@generaltask.com", "")
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts@generaltask.com\",\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"is_unlinkable\":false,\"has_bad_token\":false}]", string(body))
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("linkedaccounts2@generaltask.com", "")
		insertRetiredToken(t, api.DB, authToken, false)
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts2@generaltask.com\",\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"is_unlinkable\":false,\"has_bad_token\":false}]", string(body))

	})

	t.Run("SuccessWithBadToken", func(t *testing.T) {
		authToken := login("linkedaccounts3@generaltask.com", "")
		insertRetiredToken(t, api.DB, authToken, true)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/linked_accounts/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		googleTokenID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID.Hex()
		assert.Equal(t, "[{\"id\":\""+googleTokenID+"\",\"display_id\":\"linkedaccounts3@generaltask.com\",\"name\":\"Google Calendar\",\"logo\":\"/images/gcal.png\",\"logo_v2\":\"gcal\",\"is_unlinkable\":false,\"has_bad_token\":false}]", string(body))
	})
	UnauthorizedTest(t, "GET", "/linked_accounts/", nil)
}

func TestDeleteLinkedAccount(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	t.Run("MalformattedAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		ServeRequest(t, authToken, "DELETE", "/linked_accounts/123/", nil, http.StatusNotFound, api)
	})
	t.Run("InvalidAccountID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		ServeRequest(t, authToken, "DELETE", "/linked_accounts/"+primitive.NewObjectID().Hex()+"/", nil, http.StatusNotFound, api)
	})
	t.Run("NotUnlinkableAccount", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		googleAccountID := getGoogleTokenFromAuthToken(t, api.DB, authToken).ID
		body := ServeRequest(t, authToken, "DELETE", "/linked_accounts/"+googleAccountID.Hex()+"/", nil, http.StatusBadRequest, api)
		assert.Equal(t, "{\"detail\":\"account is not unlinkable\"}", string(body))
	})
	t.Run("AccountDifferentUser", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		authTokenOther := login("other@generaltask.com", "")
		googleAccountID := getGoogleTokenFromAuthToken(t, api.DB, authTokenOther).ID
		ServeRequest(t, authToken, "DELETE", "/linked_accounts/"+googleAccountID.Hex()+"/", nil, http.StatusNotFound, api)
	})
	t.Run("Success", func(t *testing.T) {
		authToken := login("deletelinkedaccount@generaltask.com", "")
		retiredTokenID := insertRetiredToken(t, api.DB, authToken, false)
		ServeRequest(t, authToken, "DELETE", "/linked_accounts/"+retiredTokenID.Hex()+"/", nil, http.StatusOK, api)
		var token database.ExternalAPIToken
		err := database.GetExternalTokenCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": retiredTokenID},
		).Decode(&token)
		// assert token is not found in db anymore
		assert.Error(t, err)
	})
	t.Run("SuccessGoogle", func(t *testing.T) {
		authToken := login("deletelinkedaccount_github@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		notUserID := primitive.NewObjectID()
		accountID := "correctAccountID"

		calendarAccountToDelete, err := database.UpdateOrCreateCalendarAccount(api.DB, userID, "123abc", "foobar_source",
			&database.CalendarAccount{
				UserID:     userID,
				IDExternal: accountID,
				Calendars:  []database.Calendar{{CalendarID: "cal1", ColorID: "col1"}},
				Scopes:     []string{"https://www.googleapis.com/auth/calendar"},
			}, nil)
		assert.NoError(t, err)

		calendarAccountNotToDelete, err := database.UpdateOrCreateCalendarAccount(api.DB, notUserID, "123abc", "foobar_source",
			&database.CalendarAccount{
				UserID:     notUserID,
				IDExternal: "otherAccountID",
				Calendars:  []database.Calendar{{CalendarID: "cal2", ColorID: "col2"}},
				Scopes:     []string{"https://www.googleapis.com/auth/calendar"},
			}, nil)
		assert.NoError(t, err)

		res, err := database.GetExternalTokenCollection(api.DB).InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				AccountID:    accountID,
				ServiceID:    external.TASK_SERVICE_ID_GOOGLE,
				UserID:       userID,
				DisplayID:    "Google",
				IsUnlinkable: true,
			},
		)
		assert.NoError(t, err)
		externalTokenID := res.InsertedID.(primitive.ObjectID)

		ServeRequest(t, authToken, "DELETE", "/linked_accounts/"+externalTokenID.Hex()+"/", nil, http.StatusOK, api)
		var token database.ExternalAPIToken
		err = database.GetExternalTokenCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": externalTokenID},
		).Decode(&token)
		// assert token is not found in db anymore
		assert.Error(t, err)

		var account database.CalendarAccount
		// assert calendar account is not found in db anymore
		err = database.GetCalendarAccountCollection(api.DB).FindOne(context.Background(), bson.M{"_id": calendarAccountToDelete.ID}).Decode(&account)
		assert.Error(t, err)
		// assert other calendar account is still in the db
		err = database.GetCalendarAccountCollection(api.DB).FindOne(context.Background(), bson.M{"_id": calendarAccountNotToDelete.ID}).Decode(&account)
		assert.NoError(t, err)
		assert.Equal(t, "otherAccountID", account.IDExternal)
	})
	t.Run("SuccessGoogleDeletesCalendarData", func(t *testing.T) {
		server, revoked := revokeTestServer(http.StatusOK)
		defer server.Close()
		api.ExternalConfig.GoogleOverrideURLs.RevokeURL = &server.URL
		defer func() { api.ExternalConfig.GoogleOverrideURLs.RevokeURL = nil }()

		authToken := login("unlink_calendar_data@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		accountID := "unlinkme@generaltask.com"

		eventCollection := database.GetCalendarEventCollection(api.DB)
		taskCollection := database.GetTaskCollection(api.DB)

		res, err := eventCollection.InsertOne(context.Background(), &database.CalendarEvent{
			UserID:          userID,
			SourceAccountID: accountID,
			Title:           "quarterly review",
			Body:            "private agenda",
			AttendeeEmails:  []string{"someone@example.com"},
		})
		assert.NoError(t, err)
		eventToDeleteID := res.InsertedID.(primitive.ObjectID)

		// An event from a different Google account that stays linked.
		res, err = eventCollection.InsertOne(context.Background(), &database.CalendarEvent{
			UserID:          userID,
			SourceAccountID: "keepme@generaltask.com",
			Title:           "keep me",
		})
		assert.NoError(t, err)
		eventToKeepID := res.InsertedID.(primitive.ObjectID)

		// The meeting prep task derived from the event carries the event's title,
		// so it has to go when the event does.
		prepTitle := "quarterly review"
		res, err = taskCollection.InsertOne(context.Background(), &database.Task{
			UserID:                   userID,
			Title:                    &prepTitle,
			IsMeetingPreparationTask: true,
			MeetingPreparationParams: &database.MeetingPreparationParams{CalendarEventID: eventToDeleteID},
		})
		assert.NoError(t, err)
		prepTaskID := res.InsertedID.(primitive.ObjectID)

		// A prep task whose event we already deleted because it disappeared from
		// Google (EventsList does this, and SyncMeetingTasksWithEvents keeps the
		// task). It still holds the event title, so the unlink has to reach it via
		// its own source account rather than through an event that no longer exists.
		orphanTitle := "cancelled offsite"
		res, err = taskCollection.InsertOne(context.Background(), &database.Task{
			UserID:                   userID,
			Title:                    &orphanTitle,
			SourceAccountID:          accountID,
			IsMeetingPreparationTask: true,
			MeetingPreparationParams: &database.MeetingPreparationParams{
				CalendarEventID:     primitive.NewObjectID(),
				EventMovedOrDeleted: true,
			},
		})
		assert.NoError(t, err)
		orphanTaskID := res.InsertedID.(primitive.ObjectID)

		// An orphaned prep task belonging to a different Google account must survive.
		otherOrphanTitle := "other account offsite"
		res, err = taskCollection.InsertOne(context.Background(), &database.Task{
			UserID:                   userID,
			Title:                    &otherOrphanTitle,
			SourceAccountID:          "keepme@generaltask.com",
			IsMeetingPreparationTask: true,
			MeetingPreparationParams: &database.MeetingPreparationParams{
				CalendarEventID:     primitive.NewObjectID(),
				EventMovedOrDeleted: true,
			},
		})
		assert.NoError(t, err)
		otherOrphanTaskID := res.InsertedID.(primitive.ObjectID)

		// A normal task that must survive an unlink.
		normalTitle := "write the report"
		res, err = taskCollection.InsertOne(context.Background(), &database.Task{UserID: userID, Title: &normalTitle})
		assert.NoError(t, err)
		normalTaskID := res.InsertedID.(primitive.ObjectID)

		res, err = database.GetExternalTokenCollection(api.DB).InsertOne(
			context.Background(),
			&database.ExternalAPIToken{
				AccountID:    accountID,
				ServiceID:    external.TASK_SERVICE_ID_GOOGLE,
				UserID:       userID,
				DisplayID:    "Google",
				IsUnlinkable: true,
				Token:        `{"access_token":"abc","refresh_token":"refresh_abc"}`,
			},
		)
		assert.NoError(t, err)
		externalTokenID := res.InsertedID.(primitive.ObjectID)

		ServeRequest(t, authToken, "DELETE", "/linked_accounts/"+externalTokenID.Hex()+"/", nil, http.StatusOK, api)

		assert.Equal(t, []string{"refresh_abc"}, *revoked)

		count, err := eventCollection.CountDocuments(context.Background(), bson.M{"_id": eventToDeleteID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		count, err = taskCollection.CountDocuments(context.Background(), bson.M{"_id": prepTaskID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		count, err = eventCollection.CountDocuments(context.Background(), bson.M{"_id": eventToKeepID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		count, err = taskCollection.CountDocuments(context.Background(), bson.M{"_id": normalTaskID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		// The orphan carries a Google event title, so it goes with the unlink.
		count, err = taskCollection.CountDocuments(context.Background(), bson.M{"_id": orphanTaskID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)

		// ...but only for the account being disconnected.
		count, err = taskCollection.CountDocuments(context.Background(), bson.M{"_id": otherOrphanTaskID})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)
	})
	UnauthorizedTest(t, "DELETE", "/linked_accounts/123/", nil)
}

// insertRetiredToken inserts a token for a service that has since been removed.
// Accounts created before the removal still have rows like this, so the list
// endpoint has to skip them rather than fail to resolve the service.
func insertRetiredToken(t *testing.T, db *mongo.Database, authToken string, isBadToken bool) primitive.ObjectID {
	res, err := database.GetExternalTokenCollection(db).InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			ServiceID:    "linear",
			UserID:       getUserIDFromAuthToken(t, db, authToken),
			DisplayID:    "Linear",
			IsUnlinkable: true,
			IsBadToken:   isBadToken,
		},
	)
	assert.NoError(t, err)
	return res.InsertedID.(primitive.ObjectID)
}
