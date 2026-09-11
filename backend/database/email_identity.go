package database

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Email is a login key alongside google_id. Lookups are case-insensitive.
// Collision policy:
//   - Magic-link login authenticates the oldest user with that email (created_at, then _id).
//   - Google login matches google_id first. If none, it attaches google_id to the oldest
//     user with that email and an empty google_id (a magic-link account).
//   - Two users that already have different google_ids are never merged, even when they
//     share an email. Google continues to upsert those rows by google_id.
// Email is not unique in existing data, so this code never assumes a unique index.

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func EmailLookupFilter(email string) bson.M {
	normalized := NormalizeEmail(email)
	return bson.M{"email": primitive.Regex{Pattern: "^" + regexp.QuoteMeta(normalized) + "$", Options: "i"}}
}

var oldestUserSort = bson.D{{Key: "created_at", Value: 1}, {Key: "_id", Value: 1}}

func FindOldestUserByEmail(db *mongo.Database, email string) (*User, error) {
	var user User
	err := GetUserCollection(db).FindOne(
		context.Background(),
		EmailLookupFilter(email),
		options.FindOne().SetSort(oldestUserSort),
	).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to find user by email")
		return nil, err
	}
	return &user, nil
}

func FindOrCreateUserByEmail(db *mongo.Database, email string) (*User, bool, error) {
	normalized := NormalizeEmail(email)
	existing, err := FindOldestUserByEmail(db, normalized)
	if err != nil {
		return nil, false, err
	}
	if existing != nil {
		return existing, false, nil
	}

	name := normalized
	if at := strings.Index(normalized, "@"); at > 0 {
		name = normalized[:at]
	}
	user := User{
		Email:     normalized,
		Name:      name,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC()),
	}
	result, err := GetUserCollection(db).InsertOne(context.Background(), &user)
	if err != nil {
		existing, findErr := FindOldestUserByEmail(db, normalized)
		if findErr == nil && existing != nil {
			return existing, false, nil
		}
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to create user by email")
		return nil, false, err
	}
	user.ID = result.InsertedID.(primitive.ObjectID)
	return &user, true, nil
}

func emptyGoogleIDFilter() bson.M {
	return bson.M{"$or": []bson.M{
		{"google_id": ""},
		{"google_id": bson.M{"$exists": false}},
	}}
}

// AttachGoogleIDToEmailUser sets google_id on the oldest email-only user with this address.
// Returns nil, nil when no such user exists (including when every match already has a google_id).
func AttachGoogleIDToEmailUser(db *mongo.Database, email, googleID, name string) (*User, error) {
	if NormalizeEmail(email) == "" || googleID == "" {
		return nil, nil
	}
	var user User
	err := GetUserCollection(db).FindOneAndUpdate(
		context.Background(),
		bson.M{"$and": []bson.M{
			EmailLookupFilter(email),
			emptyGoogleIDFilter(),
		}},
		bson.M{"$set": bson.M{
			"google_id": googleID,
			"name":      name,
		}},
		options.FindOneAndUpdate().SetSort(oldestUserSort).SetReturnDocument(options.After),
	).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		logger := logging.GetSentryLogger()
		logger.Error().Err(err).Msg("failed to attach google_id to email user")
		return nil, err
	}
	return &user, nil
}

func GetMagicLinkTokenCollection(db *mongo.Database) *mongo.Collection {
	return db.Collection("magic_link_tokens")
}

func EnsureMagicLinkTokenIndexes(db *mongo.Database) error {
	_, err := GetMagicLinkTokenCollection(db).Indexes().CreateMany(
		context.Background(),
		[]mongo.IndexModel{
			{
				Keys:    bson.D{{Key: "token_hash", Value: 1}},
				Options: options.Index().SetName("magic_link_token_hash"),
			},
			{
				Keys:    bson.D{{Key: "email", Value: 1}, {Key: "created_at", Value: -1}},
				Options: options.Index().SetName("magic_link_email_created_at"),
			},
			{
				Keys:    bson.D{{Key: "request_ip", Value: 1}, {Key: "created_at", Value: -1}},
				Options: options.Index().SetName("magic_link_request_ip_created_at"),
			},
			{
				Keys:    bson.D{{Key: "expires_at", Value: 1}},
				Options: options.Index().SetName("magic_link_expires_at_ttl").SetExpireAfterSeconds(0),
			},
		},
	)
	return err
}
