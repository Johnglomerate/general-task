package api

import (
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/external"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Oauth2RedirectParams struct {
	Code  string `form:"code" binding:"required"`
	State string `form:"state" binding:"required"`
}

// Link godoc
// @Summary      Redirects to link callback for that service
// @Description  First step in oauth verification
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        service_name   path      string  true  "Source ID"
// @Success      302 {object} string "URL redirect"
// @Failure      404 {object} string "service not found"
// @Failure      500 {object} string "internal server error"
// @Router       /link/{service_name}/ [get]
func (api *API) Link(c *gin.Context) {
	taskService, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c, api.DB)
	if err != nil {
		return
	}
	stateTokenID := primitive.NilObjectID
	if taskService.Details.AuthType == external.AuthTypeOauth2 {
		insertedStateToken, err := database.CreateStateToken(api.DB, &internalToken.UserID, false)
		if err != nil {
			Handle500(c)
			return
		}
		stateTokenID, err = primitive.ObjectIDFromHex(*insertedStateToken)
		if err != nil {
			Handle500(c)
			return
		}
	}
	authURL, err := taskService.Service.GetLinkURL(stateTokenID, internalToken.UserID)
	if err != nil {
		Handle500(c)
		return
	}
	c.Redirect(302, *authURL)
}

// LinkCallback godoc
// @Summary      Exchanges Oauth tokens using state and code
// @Description  Callback for initial /link/ call
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        service_name   path      string  true  "Source ID"
// @Param        code   	query     string  true  "OAuth Code"
// @Param        state  	query     string  false "OAuth State"
// @Success      200 {object} string "success"
// @Failure      400 {object} string "invalid params"
// @Failure      404 {object} string "service not found"
// @Failure      500 {object} string "internal server error"
// @Router       /link/{service_name}/callback/ [get]
func (api *API) LinkCallback(c *gin.Context) {
	taskServiceResult, err := api.ExternalConfig.GetTaskServiceResult(c.Param("service_name"))
	if err != nil {
		Handle404(c)
		return
	}
	internalToken, err := getTokenFromCookie(c, api.DB)
	if err != nil {
		return
	}
	callbackParams := external.CallbackParams{}
	if taskServiceResult.Details.AuthType == external.AuthTypeOauth2 {
		var redirectParams Oauth2RedirectParams
		if c.ShouldBind(&redirectParams) != nil || redirectParams.Code == "" || redirectParams.State == "" {
			c.JSON(400, gin.H{"detail": "missing query params"})
			return
		}
		stateTokenID, err := primitive.ObjectIDFromHex(redirectParams.State)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token format"})
			return
		}
		err = database.DeleteStateToken(api.DB, stateTokenID, &internalToken.UserID)
		if err != nil {
			c.JSON(400, gin.H{"detail": "invalid state token"})
			return
		}
		callbackParams = external.CallbackParams{Oauth2Code: &redirectParams.Code}
	}
	err = taskServiceResult.Service.HandleLinkCallback(api.DB, callbackParams, internalToken.UserID)
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}

	_, err = c.Writer.Write([]byte("<html><head><script>window.open('','_parent','');window.close();</script></head><body>Success</body></html>"))
	if err != nil {
		c.JSON(500, gin.H{"detail": err.Error()})
		return
	}
	c.Status(200)
}
