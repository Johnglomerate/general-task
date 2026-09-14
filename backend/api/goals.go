package api

import (
	"context"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type GoalCreateParams struct {
	Title          string                      `json:"title" binding:"required"`
	Why            string                      `json:"why"`
	TimeframeLabel string                      `json:"timeframeLabel"`
	TargetLabel    string                      `json:"targetLabel"`
	PaceLabel      string                      `json:"paceLabel"`
	Progress       float64                     `json:"progress"`
	ProgressLabel  string                      `json:"progressLabel"`
	Status         string                      `json:"status"`
	ProgressMode   string                      `json:"progressMode"`
	GoalType       string                      `json:"goalType"`
	Phases         []database.GoalPhase        `json:"phases"`
	ContractLine   string                      `json:"contractLine"`
	WeekLabel      string                      `json:"weekLabel"`
	Contributors   []database.GoalContributor  `json:"contributors"`
	StartDate      string                      `json:"startDate"`
	AsOf           string                      `json:"asOf"`
	Weeks          []string                    `json:"weeks"`
	Recent         []database.GoalContribution `json:"recent"`
	Footnote       string                      `json:"footnote"`
}

type GoalModifyParams struct {
	Why            *string                      `json:"why"`
	TimeframeLabel *string                      `json:"timeframeLabel"`
	TargetLabel    *string                      `json:"targetLabel"`
	PaceLabel      *string                      `json:"paceLabel"`
	Progress       *float64                     `json:"progress"`
	ProgressLabel  *string                      `json:"progressLabel"`
	Status         *string                      `json:"status"`
	ProgressMode   *string                      `json:"progressMode"`
	GoalType       *string                      `json:"goalType"`
	Phases         *[]database.GoalPhase        `json:"phases"`
	ContractLine   *string                      `json:"contractLine"`
	WeekLabel      *string                      `json:"weekLabel"`
	Contributors   *[]database.GoalContributor  `json:"contributors"`
	StartDate      *string                      `json:"startDate"`
	AsOf           *string                      `json:"asOf"`
	Weeks          *[]string                    `json:"weeks"`
	Recent         *[]database.GoalContribution `json:"recent"`
	Footnote       *string                      `json:"footnote"`
}

type GoalRecentParams struct {
	Title  string `json:"title" binding:"required"`
	Date   string `json:"date"`
	Source string `json:"source"`
}

type GoalTaskLinkParams struct {
	GoalID *string `json:"goal_id"`
}

func (api *API) GoalsList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	cursor, err := database.GetGoalCollection(api.DB).Find(
		context.Background(),
		bson.M{"user_id": userID},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}}),
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load goals")
		Handle500(c)
		return
	}
	var goals []database.Goal
	if err := cursor.All(context.Background(), &goals); err != nil {
		api.Logger.Error().Err(err).Msg("failed to decode goals")
		Handle500(c)
		return
	}
	c.JSON(200, goals)
}

func (api *API) GoalCreate(c *gin.Context) {
	var params GoalCreateParams
	if err := c.BindJSON(&params); err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	if params.Status == "" {
		params.Status = "on_track"
	}
	if params.ProgressMode == "" {
		params.ProgressMode = "manual"
	}
	if params.ProgressLabel == "" {
		params.ProgressLabel = "0%"
	}
	if params.Contributors == nil {
		params.Contributors = []database.GoalContributor{}
	}
	if params.Recent == nil {
		params.Recent = []database.GoalContribution{}
	}

	now := primitive.NewDateTimeFromTime(time.Now())
	goal := database.Goal{
		ID:             primitive.NewObjectID(),
		UserID:         getUserIDFromContext(c),
		Title:          params.Title,
		Why:            params.Why,
		TimeframeLabel: params.TimeframeLabel,
		TargetLabel:    params.TargetLabel,
		PaceLabel:      params.PaceLabel,
		Progress:       params.Progress,
		ProgressLabel:  params.ProgressLabel,
		Status:         params.Status,
		ProgressMode:   params.ProgressMode,
		GoalType:       params.GoalType,
		Phases:         params.Phases,
		ContractLine:   params.ContractLine,
		WeekLabel:      params.WeekLabel,
		Contributors:   params.Contributors,
		StartDate:      params.StartDate,
		AsOf:           params.AsOf,
		Weeks:          params.Weeks,
		Recent:         params.Recent,
		Footnote:       params.Footnote,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if _, err := database.GetGoalCollection(api.DB).InsertOne(context.Background(), &goal); err != nil {
		api.Logger.Error().Err(err).Msg("failed to create goal")
		Handle500(c)
		return
	}
	c.JSON(200, goal)
}

func (api *API) GoalModify(c *gin.Context) {
	goalID, ok := api.getGoalIDParam(c)
	if !ok {
		return
	}
	var params GoalModifyParams
	if err := c.BindJSON(&params); err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	update := bson.M{"updated_at": primitive.NewDateTimeFromTime(time.Now())}
	if params.Why != nil {
		update["why"] = *params.Why
	}
	if params.TimeframeLabel != nil {
		update["timeframe_label"] = *params.TimeframeLabel
	}
	if params.TargetLabel != nil {
		update["target_label"] = *params.TargetLabel
	}
	if params.PaceLabel != nil {
		update["pace_label"] = *params.PaceLabel
	}
	if params.Progress != nil {
		update["progress"] = *params.Progress
	}
	if params.ProgressLabel != nil {
		update["progress_label"] = *params.ProgressLabel
	}
	if params.Status != nil {
		update["status"] = *params.Status
	}
	if params.ProgressMode != nil {
		update["progress_mode"] = *params.ProgressMode
	}
	if params.GoalType != nil {
		update["goal_type"] = *params.GoalType
	}
	if params.Phases != nil {
		update["phases"] = *params.Phases
	}
	if params.ContractLine != nil {
		update["contract_line"] = *params.ContractLine
	}
	if params.WeekLabel != nil {
		update["week_label"] = *params.WeekLabel
	}
	if params.Contributors != nil {
		update["contributors"] = *params.Contributors
	}
	if params.StartDate != nil {
		update["start_date"] = *params.StartDate
	}
	if params.AsOf != nil {
		update["as_of"] = *params.AsOf
	}
	if params.Weeks != nil {
		update["weeks"] = *params.Weeks
	}
	if params.Recent != nil {
		update["recent"] = *params.Recent
	}
	if params.Footnote != nil {
		update["footnote"] = *params.Footnote
	}

	goal, err := api.updateGoal(c, goalID, bson.M{"$set": update})
	if err != nil {
		return
	}
	c.JSON(200, goal)
}

func (api *API) GoalRecentAdd(c *gin.Context) {
	goalID, ok := api.getGoalIDParam(c)
	if !ok {
		return
	}
	var params GoalRecentParams
	if err := c.BindJSON(&params); err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	if params.Date == "" {
		params.Date = "Today"
	}
	if params.Source == "" {
		params.Source = "General Task"
	}
	goal, err := api.updateGoal(c, goalID, bson.M{
		"$push": bson.M{"recent": bson.M{
			"$each":     []database.GoalContribution{{Title: params.Title, Date: params.Date, Source: params.Source}},
			"$position": 0,
		}},
		"$set": bson.M{"updated_at": primitive.NewDateTimeFromTime(time.Now())},
	})
	if err != nil {
		return
	}
	c.JSON(200, goal)
}

func (api *API) GoalTaskLinksList(c *gin.Context) {
	userID := getUserIDFromContext(c)
	cursor, err := database.GetGoalTaskLinkCollection(api.DB).Find(context.Background(), bson.M{"user_id": userID})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to load goal task links")
		Handle500(c)
		return
	}
	var links []database.GoalTaskLink
	if err := cursor.All(context.Background(), &links); err != nil {
		api.Logger.Error().Err(err).Msg("failed to decode goal task links")
		Handle500(c)
		return
	}
	result := map[string]string{}
	for _, link := range links {
		result[link.TaskID.Hex()] = link.GoalID.Hex()
	}
	c.JSON(200, result)
}

func (api *API) GoalTaskLinkModify(c *gin.Context) {
	taskIDHex := c.Param("task_id")
	taskID, err := primitive.ObjectIDFromHex(taskIDHex)
	if err != nil {
		Handle404(c)
		return
	}
	var params GoalTaskLinkParams
	if err := c.BindJSON(&params); err != nil {
		c.JSON(400, gin.H{"detail": "invalid or missing parameter"})
		return
	}
	userID := getUserIDFromContext(c)
	if _, err := database.GetTask(api.DB, taskID, userID); err != nil {
		c.JSON(404, gin.H{"detail": "task not found"})
		return
	}
	links := database.GetGoalTaskLinkCollection(api.DB)
	if params.GoalID == nil || *params.GoalID == "" {
		if _, err := links.DeleteOne(context.Background(), bson.M{"user_id": userID, "task_id": taskID}); err != nil {
			api.Logger.Error().Err(err).Msg("failed to delete goal task link")
			Handle500(c)
			return
		}
		c.JSON(200, gin.H{})
		return
	}
	goalID, err := primitive.ObjectIDFromHex(*params.GoalID)
	if err != nil {
		c.JSON(400, gin.H{"detail": "goal_id is not a valid ID"})
		return
	}
	if _, err := api.getGoal(userID, goalID); err != nil {
		c.JSON(404, gin.H{"detail": "goal not found"})
		return
	}
	now := primitive.NewDateTimeFromTime(time.Now())
	_, err = links.UpdateOne(
		context.Background(),
		bson.M{"user_id": userID, "task_id": taskID},
		bson.M{
			"$set": bson.M{"goal_id": goalID, "updated_at": now},
			"$setOnInsert": bson.M{
				"_id":        primitive.NewObjectID(),
				"user_id":    userID,
				"task_id":    taskID,
				"created_at": now,
			},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to upsert goal task link")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{})
}

func (api *API) getGoalIDParam(c *gin.Context) (primitive.ObjectID, bool) {
	goalID, err := primitive.ObjectIDFromHex(c.Param("goal_id"))
	if err != nil {
		Handle404(c)
		return primitive.NilObjectID, false
	}
	if _, err := api.getGoal(getUserIDFromContext(c), goalID); err != nil {
		c.JSON(404, gin.H{"detail": "goal not found"})
		return primitive.NilObjectID, false
	}
	return goalID, true
}

func (api *API) getGoal(userID primitive.ObjectID, goalID primitive.ObjectID) (*database.Goal, error) {
	var goal database.Goal
	err := database.GetGoalCollection(api.DB).FindOne(context.Background(), bson.M{"_id": goalID, "user_id": userID}).Decode(&goal)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to get goal")
		return nil, err
	}
	return &goal, nil
}

func (api *API) updateGoal(c *gin.Context, goalID primitive.ObjectID, update bson.M) (*database.Goal, error) {
	var goal database.Goal
	err := database.GetGoalCollection(api.DB).FindOneAndUpdate(
		context.Background(),
		bson.M{"_id": goalID, "user_id": getUserIDFromContext(c)},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&goal)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update goal")
		Handle500(c)
		return nil, err
	}
	return &goal, nil
}
