package migrations

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

type Item struct {
	TaskBase `bson:",inline"`
	TaskType `bson:"task_type"`
	Task     `bson:"task,omitempty"`
}

type TaskType struct {
	IsTask    bool `bson:"is_task"`
	IsMessage bool `bson:"is_message"`
}

// Task json & mongo model
type TaskBase struct {
	ID               primitive.ObjectID `bson:"_id,omitempty"`
	UserID           primitive.ObjectID `bson:"user_id"`
	IDExternal       string             `bson:"id_external"`
	IDOrdering       int                `bson:"id_ordering"`
	IDTaskSection    primitive.ObjectID `bson:"id_task_section"`
	IsCompleted      bool               `bson:"is_completed"`
	Sender           string             `bson:"sender"`
	SourceID         string             `bson:"source_id"`
	SourceAccountID  string             `bson:"source_account_id"`
	Deeplink         string             `bson:"deeplink"`
	Title            string             `bson:"title"`
	Body             string             `bson:"body"`
	HasBeenReordered bool               `bson:"has_been_reordered"`
	DueDate          primitive.DateTime `bson:"due_date"`
	//time in nanoseconds
	TimeAllocation    int64              `bson:"time_allocated"`
	CreatedAtExternal primitive.DateTime `bson:"created_at_external"`
	CompletedAt       primitive.DateTime `bson:"completed_at"`
}

// Comment and ExternalTaskStatus mirror the pre-migration shapes of these
// fields. They are defined here rather than imported because the integration
// that produced them has since been removed from the app's models, while the
// documents this migration operates on may still carry them.
type Comment struct {
	Body string `bson:"body"`
}

type ExternalTaskStatus struct {
	ExternalID string `bson:"external_id"`
	State      string `bson:"state"`
}

type Task struct {
	PriorityID         string             `bson:"priority_id"`
	PriorityNormalized float64            `bson:"priority_normalized"`
	TaskNumber         int                `bson:"task_number"`
	Comments           *[]Comment         `bson:"comments"`
	Status             ExternalTaskStatus `bson:"status"`
	// Used to cache the current status before marking the task as done
	PreviousStatus  ExternalTaskStatus `bson:"previous_status"`
	CompletedStatus ExternalTaskStatus `bson:"completed_status"`
}

// migratedTask decodes the fields this migration is asserted on, including the
// legacy comments field that database.Task no longer models.
type migratedTask struct {
	SourceID    string     `bson:"source_id"`
	Title       *string    `bson:"title"`
	IsCompleted *bool      `bson:"is_completed"`
	Comments    *[]Comment `bson:"comments"`
}

func TestMigrate010(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrate, err := getMigrate("")
	assert.NoError(t, err)
	err = migrate.Steps(1)
	assert.NoError(t, err)

	taskCollection := database.GetTaskCollection(db)

	t.Run("MigrateUp", func(t *testing.T) {
		taskID := primitive.NewObjectID()
		taskCollection.InsertOne(context.Background(), Item{
			TaskBase{
				ID:          taskID,
				SourceID:    "linear_task",
				Title:       "HELLO",
				IsCompleted: false,
			},
			TaskType{
				IsTask: true,
			},
			Task{
				PriorityID: "priority1",
				Comments: &[]Comment{
					{
						Body: "THERE",
					},
				},
			},
		})

		filter := bson.M{}
		count, err := taskCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		err = migrate.Steps(1)
		assert.NoError(t, err)

		count, err = taskCollection.CountDocuments(context.Background(), filter)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		var result migratedTask
		err = taskCollection.FindOne(context.Background(), filter).Decode(&result)
		assert.NoError(t, err)
		assert.Equal(t, "linear_task", result.SourceID)
		assert.Equal(t, Comment{Body: "THERE"}, (*result.Comments)[0])
		assert.Equal(t, false, *result.IsCompleted)
		assert.Equal(t, "HELLO", *result.Title)
	})
	t.Run("MigrateDown", func(t *testing.T) {
		err = migrate.Steps(-1)
		assert.NoError(t, err)
	})
}
