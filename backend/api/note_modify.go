package api

import (
	"context"
	"errors"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"

	"github.com/rs/zerolog/log"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NoteChangeable struct {
	Title     *string `json:"title,omitempty"`
	Body      *string `json:"body,omitempty"`
	Author    string  `json:"author,omitempty"`
	IsDeleted *bool   `json:"is_deleted,omitempty"`
}

type NoteModifyParams struct {
	NoteChangeable
	LegacySharedUntil  *primitive.DateTime `json:"shared_until,omitempty"`
	LegacySharedAccess *string             `json:"shared_access,omitempty"`
	LegacyIsShared     *bool               `json:"is_shared,omitempty"`
}

func (api *API) NoteModify(c *gin.Context) {
	noteIDHex := c.Param("note_id")
	noteID, err := primitive.ObjectIDFromHex(noteIDHex)
	if err != nil {
		// This means the note ID is improperly formatted
		Handle404(c)
		return
	}
	var modifyParams NoteModifyParams
	err = c.BindJSON(&modifyParams)
	if err != nil {
		c.JSON(400, gin.H{"detail": "parameter missing or malformatted"})
		return
	}

	userID := getUserIDFromContext(c)

	note, err := database.GetNote(api.DB, noteID, userID)
	if err != nil {
		c.JSON(404, gin.H{"detail": "note not found.", "noteId": noteID})
		return
	}

	if modifyParams.NoteChangeable == (NoteChangeable{}) {
		if modifyParams.LegacySharedUntil != nil || modifyParams.LegacySharedAccess != nil || modifyParams.LegacyIsShared != nil {
			c.JSON(200, gin.H{})
			return
		}
		c.JSON(400, gin.H{"detail": "note changes missing"})
		return
	}

	updatedNote := database.Note{
		UserID:    userID,
		Title:     modifyParams.NoteChangeable.Title,
		Body:      modifyParams.NoteChangeable.Body,
		Author:    modifyParams.NoteChangeable.Author,
		IsDeleted: modifyParams.NoteChangeable.IsDeleted,
		UpdatedAt: primitive.NewDateTimeFromTime(time.Now()),
		CreatedAt: note.CreatedAt,
	}

	api.UpdateNoteInDB(c, note, userID, &updatedNote)

	c.JSON(200, gin.H{})
}

func (api *API) UpdateNoteInDB(c *gin.Context, note *database.Note, userID primitive.ObjectID, updateFields *database.Note) {
	err := api.UpdateNoteInDBWithError(note, userID, updateFields)
	if err != nil {
		Handle500(c)
		return
	}
}

func (api *API) UpdateNoteInDBWithError(note *database.Note, userID primitive.ObjectID, updateFields *database.Note) error {
	noteCollection := database.GetNoteCollection(api.DB)

	res, err := noteCollection.UpdateOne(
		context.Background(),
		bson.M{"$and": []bson.M{
			{"_id": note.ID},
			{"user_id": userID},
		}},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to update internal DB")
		return err
	}
	if res.MatchedCount != 1 {
		log.Print("failed to update note", res)
		return errors.New("failed to update note")
	}

	return nil
}
