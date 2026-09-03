package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SupportedAccountType struct {
	Name             string `json:"name"`
	Logo             string `json:"logo"`
	LogoV2           string `json:"logo_v2"`
	AuthorizationURL string `json:"authorization_url"`
}

type linkedAccount struct {
	ID           string `json:"id"`
	DisplayID    string `json:"display_id"`
	Name         string `json:"name"`
	Logo         string `json:"logo"`
	LogoV2       string `json:"logo_v2"`
	IsUnlinkable bool   `json:"is_unlinkable"`
	HasBadToken  bool   `json:"has_bad_token"`
}

func (api *API) SupportedAccountTypesList(c *gin.Context) {
	serverURL := config.GetConfigValue("SERVER_URL")
	nameToService := api.ExternalConfig.GetNameToService()
	supportedAccountTypes := []SupportedAccountType{}
	for _, service := range nameToService {
		if !service.Details.IsLinkable {
			continue
		}
		supportedAccountTypes = append(supportedAccountTypes, SupportedAccountType{
			Name:             service.Details.Name,
			Logo:             service.Details.Logo,
			LogoV2:           service.Details.LogoV2,
			AuthorizationURL: serverURL + "link/" + service.Details.ID + "/",
		})
	}
	c.JSON(200, supportedAccountTypes)
}

func (api *API) LinkedAccountsList(c *gin.Context) {
	userID, _ := c.Get("user")
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)

	var tokens []database.ExternalAPIToken
	cursor, err := externalAPITokenCollection.Find(
		context.Background(),
		bson.M{"user_id": userID},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch api tokens")
		Handle500(c)
		return
	}

	err = cursor.All(context.Background(), &tokens)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to iterate through api tokens")
		Handle500(c)
		return
	}
	linkedAccounts := []linkedAccount{}
	for _, token := range tokens {
		taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(token.ServiceID)
		if err != nil {
			api.Logger.Info().Err(err).Str("service_id", token.ServiceID).Msg("skipping retired linked account")
			continue
		}
		linkedAccounts = append(linkedAccounts, linkedAccount{
			ID:           token.ID.Hex(),
			DisplayID:    token.DisplayID,
			Name:         taskServiceResult.Details.Name,
			Logo:         taskServiceResult.Details.Logo,
			LogoV2:       taskServiceResult.Details.LogoV2,
			IsUnlinkable: token.IsUnlinkable,
			HasBadToken:  token.IsBadToken,
		})
	}
	c.JSON(200, linkedAccounts)
}

func (api *API) DeleteLinkedAccount(c *gin.Context) {
	userID, _ := c.Get("user")
	accountIDHex := c.Param("account_id")
	accountID, err := primitive.ObjectIDFromHex(accountIDHex)
	if err != nil {
		// This means the account ID is improperly formatted
		Handle404(c)
		return
	}
	externalAPITokenCollection := database.GetExternalTokenCollection(api.DB)

	var accountToDelete database.ExternalAPIToken
	err = externalAPITokenCollection.FindOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"_id": accountID},
		}},
	).Decode(&accountToDelete)
	if err != nil {
		// document not found
		Handle404(c)
		return
	}
	if !accountToDelete.IsUnlinkable {
		c.JSON(400, gin.H{"detail": "account is not unlinkable"})
		return
	}
	if accountToDelete.ServiceID == external.TASK_SERVICE_ID_GOOGLE {
		// Revoke first: after the token row is gone we can no longer tell Google
		// the grant is over. A failure here must not block the unlink, since the
		// user can also revoke from their Google account page.
		err := external.RevokeGoogleToken(accountToDelete.Token, api.ExternalConfig.GoogleOverrideURLs.RevokeURL)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to revoke google token on unlink")
		}

		_, err = database.GetCalendarAccountCollection(api.DB).DeleteMany(
			context.Background(),
			bson.M{"$and": []bson.M{
				{"id_external": accountToDelete.AccountID},
				{"user_id": userID},
			}},
		)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to clean up calendar accounts")
			Handle500(c)
			return
		}

		// Calendar events hold Google user data (titles, descriptions, attendee
		// emails). Unlinking is a withdrawal of access, so the data it produced
		// goes with it rather than lingering indefinitely.
		err = api.deleteCalendarDataForAccount(getUserIDFromContext(c), accountToDelete.AccountID)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to clean up calendar data")
			Handle500(c)
			return
		}
	}

	res, err := externalAPITokenCollection.DeleteOne(
		context.Background(),
		bson.M{"_id": accountID},
	)
	if err != nil || res.DeletedCount != 1 {
		api.Logger.Error().Err(err).Msg("error deleting linked account")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

// deleteCalendarDataForAccount removes the calendar events synced from a Google
// account along with the meeting preparation tasks derived from them.
//
// Meeting prep tasks copy the event title, so they carry Google user data too.
// They are matched on their own source account rather than only via their event,
// because a prep task outlives its event: EventsList deletes stored events that
// have disappeared from Google, and SyncMeetingTasksWithEvents keeps the task
// and flags it event_moved_or_deleted. Tasks created before source_account_id
// was recorded are still reachable through their event while it exists.
func (api *API) deleteCalendarDataForAccount(userID primitive.ObjectID, accountID string) error {
	ctx := context.Background()
	eventFilter := bson.M{"$and": []bson.M{
		{"source_account_id": accountID},
		{"user_id": userID},
	}}

	var events []database.CalendarEvent
	cursor, err := database.GetCalendarEventCollection(api.DB).Find(ctx, eventFilter)
	if err != nil {
		return err
	}
	err = cursor.All(ctx, &events)
	if err != nil {
		return err
	}

	eventIDs := []primitive.ObjectID{}
	for _, event := range events {
		eventIDs = append(eventIDs, event.ID)
	}

	_, err = database.GetTaskCollection(api.DB).DeleteMany(ctx, bson.M{"$and": []bson.M{
		{"user_id": userID},
		{"is_meeting_preparation_task": true},
		{"$or": []bson.M{
			{"source_account_id": accountID},
			{"meeting_preparation_params.event_id": bson.M{"$in": eventIDs}},
		}},
	}})
	if err != nil {
		return err
	}

	_, err = database.GetCalendarEventCollection(api.DB).DeleteMany(ctx, eventFilter)
	return err
}
