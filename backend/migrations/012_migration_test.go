package migrations

import (
	"context"
	"testing"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
)

func TestMigrate012(t *testing.T) {
	db, dbCleanup, err := database.GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	migrator, err := getMigrate("")
	assert.NoError(t, err)
	err = migrator.Migrate(11)
	if err != nil && err.Error() != "no change" {
		assert.NoError(t, err)
	}

	t.Run("MigrateUp", func(t *testing.T) {
		collections := []string{"dashboard_data_points", "dashboard_team_members", "dashboard_teams"}
		for _, collection := range collections {
			_, err = db.Collection(collection).InsertOne(context.Background(), bson.M{"stale_dashboard_data": true})
			assert.NoError(t, err)
		}

		err = migrator.Steps(1)
		assert.NoError(t, err)

		for _, collection := range collections {
			count, err := db.Collection(collection).CountDocuments(context.Background(), bson.M{})
			assert.NoError(t, err)
			assert.Equal(t, int64(0), count)
		}
	})

	t.Run("MigrateDown", func(t *testing.T) {
		err = migrator.Steps(-1)
		assert.NoError(t, err)
	})
}
