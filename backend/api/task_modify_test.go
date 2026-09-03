package api

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/testutils"

	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestMarkAsDeleted(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	completed := false
	insertResult, err := taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IDExternal:  "sample_task_id",
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
		IsCompleted: &completed,
	})
	assert.NoError(t, err)
	taskID := insertResult.InsertedID.(primitive.ObjectID)
	taskIDHex := taskID.Hex()

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("MissingDeletionFlag", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("DeletionFlagFalse", func(t *testing.T) {
		err := database.MarkCompleteWithCollection(database.GetTaskCollection(db), taskID)
		assert.NoError(t, err)
		ServeRequest(t,
			authToken,
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_deleted": false}`)),
			http.StatusOK,
			api,
		)
		tasks, err := database.GetDeletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*tasks))
	})

	t.Run("InvalidHex", func(t *testing.T) {
		ServeRequest(t,
			authToken,
			"PATCH",
			"/tasks/modify/"+taskIDHex+"1/",
			bytes.NewBuffer([]byte(`{"is_deleted": false}`)),
			http.StatusNotFound,
			api,
		)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		secondAuthToken := login("tester@generaltask.com", "")
		ServeRequest(t,
			secondAuthToken,
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_deleted": false}`)),
			http.StatusNotFound,
			api,
		)
	})

	t.Run("MarkAsDeletedSuccess", func(t *testing.T) {
		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, false, *task.IsDeleted)
		ServeRequest(t,
			authToken,
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_deleted": true}`)),
			http.StatusOK,
			api,
		)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, *task.IsDeleted)
		assert.NotEqual(t, primitive.DateTime(0), task.CompletedAt)
	})
}

func TestMarkAsComplete(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	taskCollection := database.GetTaskCollection(db)

	completed := false
	insertResult, err := taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IDExternal:  "sample_task_id",
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
		IsCompleted: &completed,
	})
	assert.NoError(t, err)
	taskID := insertResult.InsertedID.(primitive.ObjectID)
	taskIDHex := taskID.Hex()

	insertResult, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IDExternal:  "sample_calendar_id",
		SourceID:    external.TASK_SOURCE_ID_GCAL,
		IsCompleted: &completed,
	})
	assert.NoError(t, err)
	calendarTaskID := insertResult.InsertedID.(primitive.ObjectID)
	calendarTaskIDHex := calendarTaskID.Hex()

	deleted := true
	insertResult, err = taskCollection.InsertOne(context.Background(), database.Task{
		UserID:      userID,
		IDExternal:  "deleted_task_id",
		SourceID:    external.TASK_SOURCE_ID_GT_TASK,
		IsCompleted: &completed,
		IsDeleted:   &deleted,
	})
	assert.NoError(t, err)
	deletedTaskID := insertResult.InsertedID.(primitive.ObjectID)
	deletedTaskIDHex := deletedTaskID.Hex()

	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	t.Run("MissingCompletionFlag", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})

	t.Run("CompletionFlagFalse", func(t *testing.T) {
		err := database.MarkCompleteWithCollection(database.GetTaskCollection(db), taskID)
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": false}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		tasks, err := database.GetCompletedTasks(db, userID)
		assert.NoError(t, err)
		assert.Equal(t, 0, len(*tasks))
	})

	t.Run("InvalidHex", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"1/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("InvalidUser", func(t *testing.T) {
		secondAuthToken := login("tester@generaltask.com", "")
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		request.Header.Add("Authorization", "Bearer "+secondAuthToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
	})

	t.Run("MarkAsDoneSuccess", func(t *testing.T) {
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, false, *task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, *task.IsCompleted)
		assert.NotEqual(t, primitive.DateTime(0), task.CompletedAt)
	})

	t.Run("CalendarSuccess", func(t *testing.T) {
		// tasks with source gcal are meeting prep tasks that can be completed
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+calendarTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`)))
		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": calendarTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, false, *task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": calendarTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, *task.IsCompleted)
	})

	t.Run("Mark complete and edit fields success", func(t *testing.T) {
		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+taskIDHex+"/",
			bytes.NewBuffer([]byte(`{
				"time_duration": 20,
				"due_date": "`+dueDate.Format(time.RFC3339)+`",
				"title": "New Title",
				"body": "New Body",
				"is_completed": true
				}`)))
		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, *task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, *task.IsCompleted)
		assert.Equal(t, "New Title", *task.Title)
		assert.Equal(t, "New Body", *task.Body)
	})
	t.Run("MarkDeletedTaskAsDoneSuccess", func(t *testing.T) {
		_, err = taskCollection.UpdateOne(context.Background(), bson.M{"_id": deletedTaskID}, bson.M{"$set": bson.M{"is_completed": false, "is_deleted": true}})
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+deletedTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true, "is_deleted": false}`)))
		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": deletedTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, false, *task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": deletedTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, true, *task.IsCompleted)
		assert.Equal(t, false, *task.IsDeleted)
		assert.NotEqual(t, primitive.DateTime(0), task.CompletedAt)
	})
	t.Run("MarkDeletedTaskAsDoneMissingField", func(t *testing.T) {
		_, err = taskCollection.UpdateOne(context.Background(), bson.M{"_id": deletedTaskID}, bson.M{"$set": bson.M{"is_completed": false, "is_deleted": true}})
		assert.NoError(t, err)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+deletedTaskIDHex+"/",
			bytes.NewBuffer([]byte(`{"is_completed": true}`))) // missing is_deleted: false field
		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": deletedTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, false, *task.IsCompleted)

		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": deletedTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, false, *task.IsCompleted)
		assert.Equal(t, true, *task.IsDeleted)
		assert.NotEqual(t, primitive.DateTime(0), task.CompletedAt)
	})
}

func TestTaskReorder(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	UnauthorizedTest(t, "PATCH", "/tasks/modify/123/", nil)
	t.Run("Success", func(t *testing.T) {
		originalTaskSectionID := primitive.NewObjectID()

		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:        userID,
				IDOrdering:    2,
				IDTaskSection: originalTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskToBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:        primitive.NewObjectID(),
				IDOrdering:    3,
				IDTaskSection: originalTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskToNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		customTaskSectionID := primitive.NewObjectID()
		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:           userID,
				IDOrdering:       1,
				IDTaskSection:    customTaskSectionID,
				SourceID:         external.TASK_SOURCE_ID_GT_TASK,
				HasBeenReordered: false,
			},
		)
		assert.NoError(t, err)
		taskToAlsoNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:        userID,
				IDOrdering:    2,
				IDTaskSection: customTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskToAlsoAlsoNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:        userID,
				IDOrdering:    1,
				IDTaskSection: originalTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 3, "id_task_section": "`+originalTaskSectionID.Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
		assert.Equal(t, originalTaskSectionID, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 1, task.IDOrdering)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 3, task.IDOrdering)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToAlsoNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 1, task.IDOrdering)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToAlsoAlsoNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
	})
	t.Run("SuccessSubTask", func(t *testing.T) {
		newAuthToken := login("approved_sub_task@generaltask.com", "")
		newUserID := getUserIDFromAuthToken(t, db, newAuthToken)

		parentTaskID := primitive.NewObjectID()
		newParentTaskID := primitive.NewObjectID()

		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:       newUserID,
				IDOrdering:   2,
				ParentTaskID: parentTaskID,
				SourceID:     external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskToBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:       primitive.NewObjectID(),
				IDOrdering:   3,
				ParentTaskID: parentTaskID,
				SourceID:     external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskToNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:           newUserID,
				IDOrdering:       1,
				ParentTaskID:     newParentTaskID,
				SourceID:         external.TASK_SOURCE_ID_GT_TASK,
				HasBeenReordered: false,
			},
		)
		assert.NoError(t, err)
		taskToAlsoNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:       newUserID,
				IDOrdering:   2,
				ParentTaskID: newParentTaskID,
				SourceID:     external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskToAlsoAlsoNotBeMovedID := insertResult.InsertedID.(primitive.ObjectID)

		insertResult, err = taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:       newUserID,
				ParentTaskID: parentTaskID,
				SourceID:     external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+newAuthToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
		assert.Equal(t, parentTaskID, task.ParentTaskID)
		assert.True(t, task.HasBeenReordered)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 3, task.IDOrdering)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 3, task.IDOrdering)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToAlsoNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 1, task.IDOrdering)

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskToAlsoAlsoNotBeMovedID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 2, task.IDOrdering)
	})
	t.Run("WrongUser", func(t *testing.T) {
		insertResult, err := taskCollection.InsertOne(context.Background(), database.Task{})
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task not found.\",\"taskId\":\""+taskIDHex+"\"}", string(body))
	})
	t.Run("MissingOrderingID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"parameter missing or malformatted\"}", string(body))
	})
	t.Run("BadTaskID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		taskIDHex := primitive.NewObjectID().Hex()
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task not found.\",\"taskId\":\""+taskIDHex+"\"}", string(body))
	})
	t.Run("WrongFormatTaskID", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/123/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusNotFound, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"not found\"}", string(body))
	})
	t.Run("BadTaskSectionIDFormat", func(t *testing.T) {
		authToken := login("approved@generaltask.com", "")
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+primitive.NewObjectID().Hex()+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2, "id_task_section": "poop"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"'id_task_section' is not a valid ID\"}", string(body))
	})
	t.Run("OnlyReorderTaskSections", func(t *testing.T) {

		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:        userID,
				IDTaskSection: constants.IDTaskSectionDefault,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_task_section": "`+constants.IDTaskSectionDefault.Hex()+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 0, task.IDOrdering)
		assert.Equal(t, constants.IDTaskSectionDefault, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)
	})
	t.Run("OnlyReorderingID", func(t *testing.T) {
		newTaskSectionID := primitive.NewObjectID()
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			database.Task{
				UserID:        userID,
				IDTaskSection: newTaskSectionID,
				SourceID:      external.TASK_SOURCE_ID_GT_TASK,
			},
		)
		assert.NoError(t, err)
		taskID := insertResult.InsertedID.(primitive.ObjectID)
		taskIDHex := taskID.Hex()

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("PATCH", "/tasks/modify/"+taskIDHex+"/", bytes.NewBuffer([]byte(`{"id_ordering": 2}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		request.Header.Add("Content-Type", "application/json")

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": taskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, 1, task.IDOrdering)
		assert.Equal(t, newTaskSectionID, task.IDTaskSection)
		assert.True(t, task.HasBeenReordered)
	})
}

func TestEditFields(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	taskCollection := database.GetTaskCollection(db)

	authToken := login("approved@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	notCompleted := false
	taskTitle := "Initial Title"
	taskBody := "Initial Body"
	taskTime := int64(60 * 60 * 1000 * 1000)
	taskPriorityNormalized := 5.0

	timeNow := primitive.NewDateTimeFromTime(time.Now())

	sampleTask := database.Task{
		IDExternal:         "ID External",
		IDOrdering:         1,
		IDTaskSection:      constants.IDTaskSectionDefault,
		IsCompleted:        &notCompleted,
		Sender:             "Sender",
		SourceID:           "gt_task",
		SourceAccountID:    "Source Account ID",
		Deeplink:           "Deeplink",
		Title:              &taskTitle,
		Body:               &taskBody,
		HasBeenReordered:   false,
		DueDate:            &timeNow,
		TimeAllocation:     &taskTime,
		CreatedAtExternal:  primitive.NewDateTimeFromTime(time.Now()),
		PriorityNormalized: &taskPriorityNormalized,
	}

	t.Run("Edit Title Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": "New title"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)
		newTitle := "New title"
		expectedTask.Title = &newTitle
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})

	t.Run("Edit Title Empty", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title": ""}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"title cannot be empty\"}", string(body))
	})

	t.Run("Edit Body Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"body": "New Body"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)
		newBody := "New Body"
		expectedTask.Body = &newBody
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})
	t.Run("Edit Due Date Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"due_date": "`+dueDate.Format(time.RFC3339)+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedDueDate := primitive.NewDateTimeFromTime(dueDate)
		expectedTask.DueDate = &expectedDueDate
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})
	t.Run("Edit Due Date with \"2006-01-02\" Date Format", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse("2006-01-02", "2021-12-06")
		assert.NoError(t, err)
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"due_date": "`+dueDate.Format("2006-01-02")+`"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		expectedDueDate := primitive.NewDateTimeFromTime(dueDate)
		expectedTask.DueDate = &expectedDueDate
		utils.AssertTasksEqual(t, &expectedTask, &task)

	})
	t.Run("Edit Due Date Empty", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"due_date": ""}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"due_date is not a valid date\"}", string(body))
	})
	t.Run("Modifying other fields does not change due date", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{
				"title": "New title",
				"body": "New body",
				"time_duration": 20,
				"is_complete": true,
				"is_deleted": true
			}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		assert.Equal(t, expectedTask.DueDate, task.DueDate)
	})
	t.Run("Edit Time Duration Success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"time_duration": 20}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		newTimeAllocation := int64(20 * 1000 * 1000)
		expectedTask.TimeAllocation = &newTimeAllocation
		utils.AssertTasksEqual(t, &expectedTask, &task)
	})
	t.Run("Edit Time Duration Negative", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"time_duration": -20}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"time duration cannot be negative\"}", string(body))
	})
	t.Run("Edit multiple fields success", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{
				"time_duration": 20,
				"due_date": "`+dueDate.Format(time.RFC3339)+`",
				"title": "New Title",
				"body": "New Body",
				"task": {"priority_normalized": 2}
				}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{}", string(body))

		var task database.Task

		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)

		newTitle := "New Title"
		newBody := "New Body"
		newTimeAllocation := int64(20 * 1000 * 1000)
		expectedDueDate := primitive.NewDateTimeFromTime(dueDate)

		expectedTask.Title = &newTitle
		expectedTask.Body = &newBody
		expectedTask.DueDate = &expectedDueDate
		expectedTask.TimeAllocation = &newTimeAllocation

		assert.Equal(t, 2.0, *task.PriorityNormalized)

		utils.AssertTasksEqual(t, &expectedTask, &task)
	})

	t.Run("Edit multiple fields empty title", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		dueDate, err := time.Parse(time.RFC3339, "2021-12-06T07:39:00-15:13")
		assert.NoError(t, err)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{
				"time_duration": 20,
				"due_date": "`+dueDate.Format(time.RFC3339)+`",
				"title": "",
				"body": "New Body"
				}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"title cannot be empty\"}", string(body))
	})

	t.Run("Edit zero fields", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)

		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"task changes missing\"}", string(body))
	})
	t.Run("Assign to other General Task user", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userCollection := database.GetUserCollection(api.DB)
		assert.NoError(t, err)
		_, err := userCollection.InsertOne(context.Background(), database.User{
			Email: "john@generaltask.com",
		})
		assert.NoError(t, err)

		expectedTask := sampleTask
		expectedTask.UserID = userID
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		router := GetRouter(api)
		request, _ := http.NewRequest(
			"PATCH",
			"/tasks/modify/"+insertedTaskID.Hex()+"/",
			bytes.NewBuffer([]byte(`{"title":"<to john>Hello!"}`)))
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)

		var task database.Task
		err = taskCollection.FindOne(context.Background(), bson.M{"_id": insertedTaskID}).Decode(&task)
		assert.NoError(t, err)
		assert.Equal(t, "Hello! from: approved@generaltask.com", *task.Title)
	})
}

func TestModifyShareableTask(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()

	taskCollection := database.GetTaskCollection(db)

	authToken := login("test_modify_shareable_task@generaltask.com", "")
	userID := getUserIDFromAuthToken(t, db, authToken)

	expectedDateTime := primitive.NewDateTimeFromTime(time.Date(2021, 1, 1, 0, 0, 0, 0, time.UTC))
	sampleTask := database.Task{
		UserID:   userID,
		SourceID: "gt_task",
	}
	t.Run("InvalidSharedAccessField", func(t *testing.T) {
		expectedTask := sampleTask
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_access": "boop"}`))
		url := "/tasks/modify/" + insertedTaskID.Hex() + "/"
		responseBody := ServeRequest(t, authToken, "PATCH", url, body, http.StatusBadRequest, api)
		expectedBody := `{"detail":"invalid shared access token"}`
		assert.Equal(t, expectedBody, string(responseBody))
	})
	t.Run("OnlyUpdateShareUntil", func(t *testing.T) {
		expectedTask := sampleTask
		sharedAccessPublic := database.SharedAccessDomain
		expectedTask.SharedAccess = &sharedAccessPublic
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_until":"2021-01-01T00:00:00Z"}`))
		url := fmt.Sprintf("/tasks/modify/%s/", insertedTaskID.Hex())
		ServeRequest(t, authToken, "PATCH", url, body, http.StatusOK, api)

		// Get the task from the database and make sure only the shared_until field was updated
		var updatedTask database.Task
		err = taskCollection.FindOne(
			context.Background(),
			bson.M{"_id": insertedTaskID},
		).Decode(&updatedTask)
		assert.NoError(t, err)
		assert.Equal(t, database.SharedAccess(1), *updatedTask.SharedAccess)
		assert.Equal(t, expectedDateTime, updatedTask.SharedUntil)
	})
	t.Run("OnlyUpdateSharedAccess", func(t *testing.T) {
		expectedTask := sampleTask
		expectedTask.SharedUntil = expectedDateTime
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_access": "domain"}`))
		url := fmt.Sprintf("/tasks/modify/%s/", insertedTaskID.Hex())
		ServeRequest(t, authToken, "PATCH", url, body, http.StatusOK, api)

		// Get the task from the database and make sure only the shared_access field was updated
		var updatedTask database.Task
		err = taskCollection.FindOne(
			context.Background(),
			bson.M{"_id": insertedTaskID},
		).Decode(&updatedTask)
		assert.NoError(t, err)
		assert.Equal(t, database.SharedAccess(1), *updatedTask.SharedAccess)
		assert.Equal(t, expectedDateTime, updatedTask.SharedUntil)
	})
	t.Run("SuccessPublic", func(t *testing.T) {
		expectedTask := sampleTask
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_access": "public", "shared_until":"2021-01-01T00:00:00Z"}`))
		url := fmt.Sprintf("/tasks/modify/%s/", insertedTaskID.Hex())
		ServeRequest(t, authToken, "PATCH", url, body, http.StatusOK, api)

		// Get the task from the database and make sure it's been updated
		var updatedTask database.Task
		err = taskCollection.FindOne(
			context.Background(),
			bson.M{"_id": insertedTaskID},
		).Decode(&updatedTask)
		assert.NoError(t, err)
		assert.Equal(t, database.SharedAccess(0), *updatedTask.SharedAccess)
		assert.Equal(t, expectedDateTime, updatedTask.SharedUntil)
	})
	t.Run("SuccessDomain", func(t *testing.T) {
		expectedTask := sampleTask
		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			expectedTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_access": "domain", "shared_until":"2021-01-01T00:00:00Z"}`))
		url := fmt.Sprintf("/tasks/modify/%s/", insertedTaskID.Hex())
		ServeRequest(t, authToken, "PATCH", url, body, http.StatusOK, api)

		// Get the task from the database and make sure it's been updated
		var updatedTask database.Task
		err = taskCollection.FindOne(
			context.Background(),
			bson.M{"_id": insertedTaskID},
		).Decode(&updatedTask)
		assert.NoError(t, err)
		assert.Equal(t, database.SharedAccess(1), *updatedTask.SharedAccess)
		assert.Equal(t, expectedDateTime, updatedTask.SharedUntil)
	})
	t.Run("ModifySharedAccessInvalidSourceID", func(t *testing.T) {
		invalidSourceIDTask := sampleTask
		invalidSourceIDTask.SourceID = "jira"

		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			invalidSourceIDTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_access": "domain"}`))
		url := fmt.Sprintf("/tasks/modify/%s/", insertedTaskID.Hex())
		responseBody := ServeRequest(t, authToken, "PATCH", url, body, http.StatusBadRequest, api)
		expectedBody := `{"detail":"only General Task tasks can be shared"}`
		assert.Equal(t, expectedBody, string(responseBody))
	})
	t.Run("ModifyShareUntilInvalidSourceID", func(t *testing.T) {
		invalidSourceIDTask := sampleTask
		invalidSourceIDTask.SourceID = "jira"

		insertResult, err := taskCollection.InsertOne(
			context.Background(),
			invalidSourceIDTask,
		)
		assert.NoError(t, err)
		insertedTaskID := insertResult.InsertedID.(primitive.ObjectID)

		body := bytes.NewBuffer([]byte(`{"shared_until":"2021-01-01T00:00:00Z"}`))
		url := fmt.Sprintf("/tasks/modify/%s/", insertedTaskID.Hex())
		responseBody := ServeRequest(t, authToken, "PATCH", url, body, http.StatusBadRequest, api)
		expectedBody := `{"detail":"only General Task tasks can be shared"}`
		assert.Equal(t, expectedBody, string(responseBody))
	})
}
