package database

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestFindOldestUserByEmail(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	collection := GetUserCollection(db)

	olderID := primitive.NewObjectID()
	newerID := primitive.NewObjectID()
	_, err = collection.InsertOne(context.Background(), &User{
		ID:        olderID,
		Email:     "Merge.Me@Example.com",
		GoogleID:  "google-older",
		CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-time.Hour)),
	})
	assert.NoError(t, err)
	_, err = collection.InsertOne(context.Background(), &User{
		ID:        newerID,
		Email:     "merge.me@example.com",
		GoogleID:  "google-newer",
		CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC()),
	})
	assert.NoError(t, err)

	t.Run("CaseInsensitiveOldest", func(t *testing.T) {
		user, err := FindOldestUserByEmail(db, "MERGE.ME@example.com")
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, olderID, user.ID)
	})
	t.Run("Missing", func(t *testing.T) {
		user, err := FindOldestUserByEmail(db, "nobody-" + olderID.Hex() + "@example.com")
		assert.NoError(t, err)
		assert.Nil(t, user)
	})
}

func TestFindOrCreateUserByEmail(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()

	email := "create-" + primitive.NewObjectID().Hex() + "@example.com"

	t.Run("CreatesLowercase", func(t *testing.T) {
		user, isNew, err := FindOrCreateUserByEmail(db, "  "+email+"  ")
		assert.NoError(t, err)
		assert.True(t, isNew)
		assert.Equal(t, email, user.Email)
		assert.Equal(t, "", user.GoogleID)
		assert.Equal(t, email[:len(email)-12], user.Name)
	})
	t.Run("FindsExisting", func(t *testing.T) {
		first, _, err := FindOrCreateUserByEmail(db, email)
		assert.NoError(t, err)
		second, isNew, err := FindOrCreateUserByEmail(db, "CREATE-"+email[7:])
		assert.NoError(t, err)
		assert.False(t, isNew)
		assert.Equal(t, first.ID, second.ID)
	})
}

func TestAttachGoogleIDToEmailUser(t *testing.T) {
	db, dbCleanup, err := GetDBConnection()
	assert.NoError(t, err)
	defer dbCleanup()
	collection := GetUserCollection(db)

	t.Run("AttachesToEmailOnlyUser", func(t *testing.T) {
		email := "attach-" + primitive.NewObjectID().Hex() + "@example.com"
		inserted, err := collection.InsertOne(context.Background(), &User{
			Email:     email,
			Name:      "before",
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC()),
		})
		assert.NoError(t, err)

		user, err := AttachGoogleIDToEmailUser(db, email, "sub-123", "After Name")
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, inserted.InsertedID, user.ID)
		assert.Equal(t, "sub-123", user.GoogleID)
		assert.Equal(t, "After Name", user.Name)
	})
	t.Run("DoesNotStealGoogleUser", func(t *testing.T) {
		email := "taken-" + primitive.NewObjectID().Hex() + "@example.com"
		_, err := collection.InsertOne(context.Background(), &User{
			Email:     email,
			GoogleID:  "already-has-google",
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC()),
		})
		assert.NoError(t, err)

		user, err := AttachGoogleIDToEmailUser(db, email, "other-sub", "Nope")
		assert.NoError(t, err)
		assert.Nil(t, user)
	})
	t.Run("PrefersOldestEmailOnlyUser", func(t *testing.T) {
		email := "multi-" + primitive.NewObjectID().Hex() + "@example.com"
		older, err := collection.InsertOne(context.Background(), &User{
			Email:     email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-time.Hour)),
		})
		assert.NoError(t, err)
		_, err = collection.InsertOne(context.Background(), &User{
			Email:     email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC()),
		})
		assert.NoError(t, err)

		user, err := AttachGoogleIDToEmailUser(db, email, "sub-oldest", "Oldest")
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, older.InsertedID, user.ID)
		assert.Equal(t, "sub-oldest", user.GoogleID)
	})
}
