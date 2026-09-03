package api

import (
	"context"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestTaskBaseToTaskResult(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	t.Run("NoSourceID", func(t *testing.T) {
		dueDate := time.Unix(0, 0)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID: "invalid source",
			DueDate:  &primitiveDueDate,
		}, userID)
		assert.Equal(t, "", result.DueDate)
	})
	t.Run("InvalidDueDate", func(t *testing.T) {
		dueDate := time.Unix(0, 0)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID: external.TASK_SOURCE_ID_GT_TASK,
			DueDate:  &primitiveDueDate,
		}, userID)
		assert.Equal(t, "", result.DueDate)
	})
	t.Run("ValidDueDate", func(t *testing.T) {
		dueDate := time.Unix(1676478754, 0)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID: external.TASK_SOURCE_ID_GT_TASK,
			DueDate:  &primitiveDueDate,
		}, userID)
		assert.Equal(t, primitiveDueDate.Time().UTC().Format(constants.YEAR_MONTH_DAY_FORMAT), result.DueDate)
	})
	t.Run("ValidTemplateID", func(t *testing.T) {
		templateID := primitive.NewObjectID()
		result := api.taskBaseToTaskResult(&database.Task{
			SourceID:                external.TASK_SOURCE_ID_GT_TASK,
			RecurringTaskTemplateID: templateID,
		}, userID)
		assert.Equal(t, templateID, result.RecurringTaskTemplateID)
	})
	t.Run("AllFieldSuccess", func(t *testing.T) {
		dueDate := time.Unix(1676478754, 0)
		timeAllocation := int64(420)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		notCompleted := false
		title := "hello!"
		body := "example body"
		priority := 3.0

		result := api.taskBaseToTaskResult(&database.Task{
			SourceID:           external.TASK_SOURCE_ID_GT_TASK,
			DueDate:            &primitiveDueDate,
			PriorityNormalized: &priority,
			TimeAllocation:     &timeAllocation,
			IsCompleted:        &notCompleted,
			Title:              &title,
			Body:               &body,
		}, userID)
		// TODO change to a helper method to compare taskResults
		assert.Equal(t, primitiveDueDate.Time().UTC().Format(constants.YEAR_MONTH_DAY_FORMAT), result.DueDate)
		assert.Equal(t, timeAllocation, result.TimeAllocation)
		assert.False(t, result.IsDone)
		assert.Equal(t, title, result.Title)
		assert.Equal(t, body, result.Body)
		assert.Equal(t, priority, result.PriorityNormalized)
		assert.Equal(t, primitive.NilObjectID, result.RecurringTaskTemplateID)
	})
}

func TestTaskListToTaskResultList(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	t.Run("SubtaskSuccess", func(t *testing.T) {
		dueDate := time.Unix(1676478754, 0)
		timeAllocation := int64(420)
		primitiveDueDate := primitive.NewDateTimeFromTime(dueDate)
		notCompleted := false
		title := "hello!"
		body := "example body"

		parentTaskID := primitive.NewObjectID()
		results := api.taskListToTaskResultList(&[]database.Task{
			{
				ID:             parentTaskID,
				UserID:         userID,
				SourceID:       external.TASK_SOURCE_ID_GT_TASK,
				DueDate:        &primitiveDueDate,
				TimeAllocation: &timeAllocation,
				IsCompleted:    &notCompleted,
				Title:          &title,
				Body:           &body,
			},
			{
				UserID:        userID,
				IsCompleted:   &notCompleted,
				IDTaskSection: primitive.NilObjectID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
				ParentTaskID:  parentTaskID,
			}}, userID)

		result := results[0]
		// TODO change to a helper method to compare taskResults
		assert.Equal(t, primitiveDueDate.Time().UTC().Format(constants.YEAR_MONTH_DAY_FORMAT), result.DueDate)
		assert.Equal(t, timeAllocation, result.TimeAllocation)
		assert.False(t, result.IsDone)
		assert.Equal(t, title, result.Title)
		assert.Equal(t, body, result.Body)
		assert.Equal(t, 1, len(result.SubTasks))
	})
}

func TestGetSubtaskResults(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	t.Run("NoSubtasks", func(t *testing.T) {
		results := api.getSubtaskResults(primitive.NewObjectID(), userID)
		assert.Equal(t, 0, len(results))
	})
	t.Run("SubtaskSuccess", func(t *testing.T) {
		notCompleted := false

		taskCollection := database.GetTaskCollection(api.DB)
		parentTaskID := primitive.NewObjectID()
		insertResult, err := taskCollection.InsertOne(context.Background(), database.Task{
			UserID:        userID,
			IsCompleted:   &notCompleted,
			IDTaskSection: primitive.NilObjectID,
			SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			ParentTaskID:  parentTaskID,
		})
		assert.NoError(t, err)

		results := api.getSubtaskResults(parentTaskID, userID)
		assert.Equal(t, 1, len(results))
		assert.Equal(t, insertResult.InsertedID.(primitive.ObjectID), results[0].ID)
	})

}

func TestUpdateLastFullRefreshTime(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	userID := primitive.NewObjectID()
	accountID := "test@generaltask.com"

	collection := database.GetExternalTokenCollection(api.DB)
	token := database.ExternalAPIToken{
		UserID:     userID,
		AccountID:  accountID,
		ServiceID:  external.TASK_SERVICE_ID_GOOGLE,
		ExternalID: "external",
	}
	collection.InsertOne(context.Background(), token)

	t.Run("Success", func(t *testing.T) {
		err := api.updateLastFullRefreshTime(token)
		assert.NoError(t, err)

		response := database.FindOneExternalWithCollection(collection, userID, "external")
		var tokenDB database.ExternalAPIToken
		response.Decode(&tokenDB)
		assert.Less(t, (15 * time.Minute), time.Now().Sub(tokenDB.LastFullRefreshTime.Time()))
	})
}
