package migrations

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

// TestMigrate012 covers the migration that retires every non-Google integration.
// It is the guardrail for existing accounts: leaving their integration views,
// tokens and tasks in place would surface rows the API no longer knows how to
// render, so this asserts both that the retired data goes and that the Google
// and General Task data alongside it is untouched.
func TestMigrate012(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	userID := primitive.NewObjectID()
	taskCollection := database.GetTaskCollection(db)
	viewCollection := database.GetViewCollection(db)
	externalTokenCollection := database.GetExternalTokenCollection(db)
	eventCollection := database.GetCalendarEventCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		for _, sourceID := range []string{"jira", "linear_task", "asana_task"} {
			_, err := taskCollection.InsertOne(context.Background(), database.Task{
				UserID:   userID,
				SourceID: sourceID,
			})
			assert.NoError(t, err)
		}
		slackTaskID := primitive.NewObjectID()
		_, err := taskCollection.InsertOne(context.Background(), database.Task{
			ID:              slackTaskID,
			UserID:          userID,
			SourceID:        "slack",
			SourceAccountID: "some-slack-account",
			Deeplink:        "https://slack.example/message",
		})
		assert.NoError(t, err)
		gtTaskID := primitive.NewObjectID()
		_, err = taskCollection.InsertOne(context.Background(), database.Task{
			ID:       gtTaskID,
			UserID:   userID,
			SourceID: external.TASK_SOURCE_ID_GT_TASK,
		})
		assert.NoError(t, err)

		for _, viewType := range constants.RetiredViewTypes {
			_, err := viewCollection.InsertOne(context.Background(), database.View{
				UserID: userID,
				Type:   viewType,
			})
			assert.NoError(t, err)
		}
		_, err = viewCollection.InsertOne(context.Background(), database.View{
			UserID: userID,
			Type:   string(constants.ViewTaskSection),
		})
		assert.NoError(t, err)

		for _, serviceID := range []string{"asana", "atlassian", "github", "linear", "slack", "slack_app"} {
			_, err := externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
				UserID:    userID,
				ServiceID: serviceID,
			})
			assert.NoError(t, err)
		}
		_, err = externalTokenCollection.InsertOne(context.Background(), database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
		})
		assert.NoError(t, err)

		prEventID := primitive.NewObjectID()
		_, err = eventCollection.InsertOne(context.Background(), bson.M{
			"_id":                    prEventID,
			"user_id":                userID,
			"linked_task_source_id":  "github_pr",
			"linked_pull_request_id": primitive.NewObjectID(),
		})
		assert.NoError(t, err)

		err = migrate.Steps(1)
		assert.NoError(t, err)

		// Retired tasks are gone; the Slack task is kept but reassigned to the
		// native source so the user does not silently lose saved work.
		count, err := taskCollection.CountDocuments(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(2), count)

		var slackTask database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": slackTaskID}).Decode(&slackTask)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SOURCE_ID_GT_TASK, slackTask.SourceID)
		assert.Equal(t, external.GeneralTaskDefaultAccountID, slackTask.SourceAccountID)
		assert.Equal(t, "", slackTask.Deeplink)

		var gtTask database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": gtTaskID}).Decode(&gtTask)
		assert.NoError(t, err)
		assert.Equal(t, external.TASK_SOURCE_ID_GT_TASK, gtTask.SourceID)

		// Only the task section view survives, so the overview never has to
		// dispatch on a view type the API no longer implements.
		var views []database.View
		cursor, err := viewCollection.Find(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.NoError(t, cursor.All(context.Background(), &views))
		assert.Equal(t, 1, len(views))
		assert.Equal(t, string(constants.ViewTaskSection), views[0].Type)

		// Only the Google token survives, so task fetch never has to resolve a
		// service that no longer exists.
		var tokens []database.ExternalAPIToken
		cursor, err = externalTokenCollection.Find(context.Background(), bson.M{"user_id": userID})
		assert.NoError(t, err)
		assert.NoError(t, cursor.All(context.Background(), &tokens))
		assert.Equal(t, 1, len(tokens))
		assert.Equal(t, external.TASK_SERVICE_ID_GOOGLE, tokens[0].ServiceID)

		// The calendar event itself is a real Google event, so it stays; only
		// its link to the removed pull request is cleared.
		var event bson.M
		err = eventCollection.FindOne(context.Background(), bson.M{"_id": prEventID}).Decode(&event)
		assert.NoError(t, err)
		_, hasPRLink := event["linked_pull_request_id"]
		assert.False(t, hasPRLink)
		_, hasSourceLink := event["linked_task_source_id"]
		assert.False(t, hasSourceLink)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
