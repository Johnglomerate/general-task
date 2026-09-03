package settings

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestGetSettingsOptions(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	userID := primitive.NewObjectID()
	viewCollection := database.GetViewCollection(db)
	view := database.View{
		UserID: userID,
		Type:   string(constants.ViewTaskSection),
	}
	_, err = viewCollection.InsertOne(context.Background(), view)
	assert.NoError(t, err)
	// wrong user ID
	_, err = viewCollection.InsertOne(context.Background(), database.View{
		UserID: primitive.NewObjectID(),
		Type:   string(constants.ViewTaskSection),
	})
	assert.NoError(t, err)
	// wrong view type
	_, err = viewCollection.InsertOne(context.Background(), database.View{
		UserID: userID,
		Type:   string(constants.ViewMeetingPreparation),
	})
	assert.NoError(t, err)

	taskSectionCollection := database.GetTaskSectionCollection(db)
	res, err = taskSectionCollection.InsertOne(context.Background(), database.TaskSection{UserID: userID})
	assert.NoError(t, err)
	// wrong user ID
	_, err = taskSectionCollection.InsertOne(context.Background(), database.TaskSection{UserID: primitive.NewObjectID()})
	assert.NoError(t, err)
	insertedSectionID := res.InsertedID.(primitive.ObjectID).Hex()

	externalTokenCollection := database.GetExternalTokenCollection(db)
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
			AccountID: "a",
			DisplayID: "oof 1",
		},
	)
	assert.NoError(t, err)
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
			AccountID: "b",
			DisplayID: "oof 2",
		},
	)
	assert.NoError(t, err)

	calendarAccountCollection := database.GetCalendarAccountCollection(db)
	_, err = calendarAccountCollection.InsertOne(
		context.Background(),
		&database.CalendarAccount{
			UserID:     userID,
			IDExternal: "b",
			Calendars:  []database.Calendar{{"", "cal1", "", "title1", "", ""}, {"", "cal2", "", "title2", "", ""}},
		},
	)
	assert.NoError(t, err)
	// wrong user id
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    primitive.NewObjectID(),
			ServiceID: external.TASK_SERVICE_ID_GOOGLE,
		},
	)
	assert.NoError(t, err)
	// wrong service id
	_, err = externalTokenCollection.InsertOne(
		context.Background(),
		&database.ExternalAPIToken{
			UserID:    userID,
			ServiceID: "gabagool",
		},
	)
	assert.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		settings, err := GetSettingsOptions(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 18, len(*settings))
		assert.Equal(t, "note_sorting_preference", (*settings)[0].FieldKey)
		assert.Equal(t, "note_sorting_direction", (*settings)[1].FieldKey)
		assert.Equal(t, "note_filtering_preference", (*settings)[2].FieldKey)
		assert.Equal(t, "recurring_task_filtering_preference", (*settings)[3].FieldKey)
		assert.Equal(t, "collapse_empty_lists", (*settings)[4].FieldKey)
		assert.Equal(t, "move_empty_lists_to_bottom", (*settings)[5].FieldKey)
		assert.Equal(t, "lab_smart_prioritize_enabled", (*settings)[6].FieldKey)
		assert.Equal(t, "has_dismissed_multical_prompt", (*settings)[7].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_preference_main", (*settings)[8].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_direction_main", (*settings)[9].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_preference_overview", (*settings)[10].FieldKey)
		assert.Equal(t, insertedSectionID+"_task_sorting_direction_overview", (*settings)[11].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_preference_main", (*settings)[12].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_direction_main", (*settings)[13].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_preference_overview", (*settings)[14].FieldKey)
		assert.Equal(t, "000000000000000000000001_task_sorting_direction_overview", (*settings)[15].FieldKey)
		calendarSetting := (*settings)[16]
		assert.Equal(t, constants.SettingFieldCalendarForNewTasks, calendarSetting.FieldKey)
		assert.Equal(t, "a", calendarSetting.DefaultChoice)
		assert.Equal(t, []SettingChoice{
			{Key: "a", Name: "oof 1"},
			{Key: "b", Name: "oof 2"},
			{Key: "", Name: ""},
		}, calendarSetting.Choices)
		calendarIDSetting := (*settings)[17]
		assert.Equal(t, constants.SettingFieldCalendarIDForNewTasks, calendarIDSetting.FieldKey)
		assert.Equal(t, []SettingChoice{
			{Key: "cal1", Name: "title1"},
			{Key: "cal2", Name: "title2"},
			{Key: "", Name: ""},
		}, calendarIDSetting.Choices)
	})
}
