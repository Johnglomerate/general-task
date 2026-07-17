package api

import (
	"context"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// DeleteAccount permanently removes a user, every record scoped to them, and the
// OAuth grants backing their linked accounts.
//
// Google's API Services User Data Policy requires users be able to request
// deletion of the data we obtained from Google, and our privacy policy documents
// this endpoint as the mechanism, so it must stay reachable from the UI.
func (api *API) DeleteAccount(c *gin.Context) {
	userID := getUserIDFromContext(c)

	// Revoke before the purge: once the token rows are gone we no longer hold the
	// credentials needed to tell Google the grant is over.
	api.revokeExternalGrants(userID)

	err := api.purgeUserData(userID)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to delete account")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

// revokeExternalGrants tells Google to drop the OAuth grants we hold for this
// user. Failures are logged rather than returned: the user asked us to delete
// their data, and a Google-side error must not be able to block that.
func (api *API) revokeExternalGrants(userID primitive.ObjectID) {
	var tokens []database.ExternalAPIToken
	cursor, err := database.GetExternalTokenCollection(api.DB).Find(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"user_id": userID},
			{"service_id": external.TASK_SERVICE_ID_GOOGLE},
		}},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to fetch google tokens for revocation")
		return
	}
	err = cursor.All(context.Background(), &tokens)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to decode google tokens for revocation")
		return
	}

	for _, token := range tokens {
		err = external.RevokeGoogleToken(token.Token, api.ExternalConfig.GoogleOverrideURLs.RevokeURL)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to revoke google token during account deletion")
		}
	}
}

// purgeUserData deletes every record belonging to the user, ending with the user
// document itself so that a failure part way through leaves the account intact
// and the request retryable.
func (api *API) purgeUserData(userID primitive.ObjectID) error {
	ctx := context.Background()

	for _, collection := range api.userScopedCollections() {
		_, err := collection.DeleteMany(ctx, bson.M{"user_id": userID})
		if err != nil {
			return err
		}
	}

	err := api.purgeDashboardData(userID)
	if err != nil {
		return err
	}

	_, err = database.GetUserCollection(api.DB).DeleteOne(ctx, bson.M{"_id": userID})
	return err
}

// userScopedCollections lists every collection holding documents keyed by
// user_id. Anything added to the schema with a user_id belongs here too.
func (api *API) userScopedCollections() []*mongo.Collection {
	return []*mongo.Collection{
		// Google user data (calendar events carry titles, descriptions and attendees)
		database.GetCalendarEventCollection(api.DB),
		database.GetCalendarAccountCollection(api.DB),
		// Content
		database.GetTaskCollection(api.DB),
		database.GetNoteCollection(api.DB),
		database.GetTaskSectionCollection(api.DB),
		database.GetRecurringTaskTemplateCollection(api.DB),
		database.GetViewCollection(api.DB),
		database.GetPullRequestCollection(api.DB),
		database.GetRepositoryCollection(api.DB),
		// Settings
		database.GetUserSettingsCollection(api.DB),
		database.GetDefaultSectionSettingsCollection(api.DB),
		database.GetJiraSitesCollection(api.DB),
		database.GetJiraPrioritiesCollection(api.DB),
		// Logs and support records
		database.GetFeedbackItemCollection(api.DB),
		database.GetLogEventsCollection(api.DB),
		database.GetServerRequestCollection(api.DB),
		// Credentials, deleted last so a partial failure leaves them revocable
		database.GetOauth1RequestsSecretsCollection(api.DB),
		database.GetStateTokenCollection(api.DB),
		database.GetExternalTokenCollection(api.DB),
		database.GetInternalTokenCollection(api.DB),
	}
}

// purgeDashboardData removes the user's dashboard teams and everything hanging
// off them. Team members and data points are keyed by team_id rather than
// user_id, so they need the team lookup to be reachable.
func (api *API) purgeDashboardData(userID primitive.ObjectID) error {
	ctx := context.Background()

	var teams []database.DashboardTeam
	cursor, err := database.GetDashboardTeamCollection(api.DB).Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return err
	}
	err = cursor.All(ctx, &teams)
	if err != nil {
		return err
	}
	if len(teams) == 0 {
		return nil
	}

	teamIDs := []primitive.ObjectID{}
	for _, team := range teams {
		teamIDs = append(teamIDs, team.ID)
	}

	var members []database.DashboardTeamMember
	cursor, err = database.GetDashboardTeamMemberCollection(api.DB).Find(ctx, bson.M{"team_id": bson.M{"$in": teamIDs}})
	if err != nil {
		return err
	}
	err = cursor.All(ctx, &members)
	if err != nil {
		return err
	}
	memberIDs := []primitive.ObjectID{}
	for _, member := range members {
		memberIDs = append(memberIDs, member.ID)
	}

	// Data points are attributed to either a team or an individual member.
	_, err = database.GetDashboardDataPointCollection(api.DB).DeleteMany(ctx, bson.M{"$or": []bson.M{
		{"team_id": bson.M{"$in": teamIDs}},
		{"individual_id": bson.M{"$in": memberIDs}},
	}})
	if err != nil {
		return err
	}

	_, err = database.GetDashboardTeamMemberCollection(api.DB).DeleteMany(ctx, bson.M{"team_id": bson.M{"$in": teamIDs}})
	if err != nil {
		return err
	}

	_, err = database.GetDashboardTeamCollection(api.DB).DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}
