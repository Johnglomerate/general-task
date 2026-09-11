package api

import (
	"github.com/gin-gonic/gin"
)

func (api *API) NoteDetails(c *gin.Context) {
	c.JSON(410, gin.H{"detail": "shared notes are no longer available"})
}
