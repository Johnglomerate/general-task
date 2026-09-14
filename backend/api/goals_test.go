package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func authedRequest(router http.Handler, method string, path string, authToken string, body []byte) *httptest.ResponseRecorder {
	request, _ := http.NewRequest(method, path, bytes.NewBuffer(body))
	request.Header.Add("Authorization", "Bearer "+authToken)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func TestGoalsAPI(t *testing.T) {
	authToken := login("goals@generaltask.com", "")
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)
	userID := getUserIDFromAuthToken(t, api.DB, authToken)
	type goalResponse struct {
		ID       string                      `json:"id"`
		Title    string                      `json:"title"`
		Status   string                      `json:"status"`
		Progress float64                     `json:"progress"`
		Recent   []database.GoalContribution `json:"recent"`
	}

	t.Run("CreateListModifyAndRecent", func(t *testing.T) {
		createBody := []byte(`{
			"title": "Run my first half marathon",
			"why": "Build weekly long-run consistency",
			"timeframeLabel": "Jun 1 - Aug 31",
			"targetLabel": "12 long runs",
			"paceLabel": "Just created",
			"progress": 0,
			"progressLabel": "0 of 12",
			"status": "on_track",
			"progressMode": "cadence",
			"goalType": "consistency",
			"contributors": [{"kind": "recurring", "label": "One long run / week"}],
			"recent": []
		}`)
		recorder := authedRequest(router, "POST", "/goals/", authToken, createBody)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var created goalResponse
		assert.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &created))
		assert.Equal(t, "Run my first half marathon", created.Title)
		assert.NotEmpty(t, created.ID)

		recorder = authedRequest(router, "GET", "/goals/", authToken, nil)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var goals []goalResponse
		assert.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &goals))
		assert.Len(t, goals, 1)
		assert.Equal(t, created.ID, goals[0].ID)

		recorder = authedRequest(router, "PATCH", "/goals/"+created.ID+"/", authToken, []byte(`{"status":"off_track","progress":0.25,"progressLabel":"3 of 12"}`))
		assert.Equal(t, http.StatusOK, recorder.Code)
		var updated goalResponse
		assert.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &updated))
		assert.Equal(t, "off_track", updated.Status)
		assert.Equal(t, 0.25, updated.Progress)

		recorder = authedRequest(router, "POST", "/goals/"+created.ID+"/recent/", authToken, []byte(`{"title":"8 mi around the lake"}`))
		assert.Equal(t, http.StatusOK, recorder.Code)
		var withRecent goalResponse
		assert.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &withRecent))
		assert.Len(t, withRecent.Recent, 1)
		assert.Equal(t, "8 mi around the lake", withRecent.Recent[0].Title)
		assert.Equal(t, "General Task", withRecent.Recent[0].Source)
	})

	t.Run("TaskLinks", func(t *testing.T) {
		goal := database.Goal{
			ID:           primitive.NewObjectID(),
			UserID:       userID,
			Title:        "Linkable goal",
			Status:       "on_track",
			ProgressMode: "manual",
			Contributors: []database.GoalContributor{},
			Recent:       []database.GoalContribution{},
		}
		_, err := database.GetGoalCollection(api.DB).InsertOne(context.Background(), &goal)
		assert.NoError(t, err)

		title := "Goal-linked task"
		done := false
		task := database.Task{ID: primitive.NewObjectID(), UserID: userID, Title: &title, IsCompleted: &done}
		_, err = database.GetTaskCollection(api.DB).InsertOne(context.Background(), &task)
		assert.NoError(t, err)

		recorder := authedRequest(router, "PATCH", "/goals/task_links/"+task.ID.Hex()+"/", authToken, []byte(`{"goal_id":"`+goal.ID.Hex()+`"}`))
		assert.Equal(t, http.StatusOK, recorder.Code)

		recorder = authedRequest(router, "GET", "/goals/task_links/", authToken, nil)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var links map[string]string
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.NoError(t, json.Unmarshal(body, &links))
		assert.Equal(t, goal.ID.Hex(), links[task.ID.Hex()])

		recorder = authedRequest(router, "PATCH", "/goals/task_links/"+task.ID.Hex()+"/", authToken, []byte(`{"goal_id":null}`))
		assert.Equal(t, http.StatusOK, recorder.Code)
		count, err := database.GetGoalTaskLinkCollection(api.DB).CountDocuments(context.Background(), bson.M{"task_id": task.ID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
}
