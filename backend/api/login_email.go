package api

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type LoginEmailParams struct {
	Email string `json:"email"`
}

type LoginEmailCallbackParams struct {
	Token string `form:"token"`
}

// LoginEmailRequest godoc
// @Summary      Email a one-time login link
// @Description  Always returns 200 for a valid email so the response does not reveal whether the address is registered
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        email  body  LoginEmailParams  true  "email"
// @Success      200 {object} string "login link sent"
// @Failure      400 {object} string "invalid params"
// @Failure      500 {object} string "internal server error"
// @Router       /login/email/ [post]
func (api *API) LoginEmailRequest(c *gin.Context) {
	var params LoginEmailParams
	err := c.BindJSON(&params)
	if err != nil || params.Email == "" {
		c.JSON(400, gin.H{"detail": "invalid or missing 'email' parameter."})
		return
	}
	if !utils.IsEmailValid(params.Email) {
		c.JSON(400, gin.H{"detail": "invalid email format."})
		return
	}
	email := database.NormalizeEmail(params.Email)

	now := api.GetCurrentTime()
	tokenCollection := database.GetMagicLinkTokenCollection(api.DB)
	cooldownDuration := time.Duration(constants.MAGIC_LINK_COOLDOWN_SECONDS) * time.Second
	cooldownThreshold := primitive.NewDateTimeFromTime(now.Add(-cooldownDuration))

	var recentToken database.MagicLinkToken
	err = tokenCollection.FindOne(
		context.Background(),
		bson.M{"email": email, "created_at": bson.M{"$gt": cooldownThreshold}},
	).Decode(&recentToken)
	if err == nil {
		c.JSON(200, gin.H{"detail": "login link sent"})
		return
	}
	if err != mongo.ErrNoDocuments {
		api.Logger.Error().Err(err).Msg("failed to check recent magic link token")
		Handle500(c)
		return
	}

	requestIP := c.ClientIP()
	if requestIP != "" {
		recentIPCount, err := tokenCollection.CountDocuments(
			context.Background(),
			bson.M{"request_ip": requestIP, "created_at": bson.M{"$gt": cooldownThreshold}},
		)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to check magic link ip cooldown")
			Handle500(c)
			return
		}
		if recentIPCount >= constants.MAGIC_LINK_IP_REQUEST_LIMIT {
			c.JSON(200, gin.H{"detail": "login link sent"})
			return
		}
	}

	plaintext, err := generateMagicLinkToken()
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to generate magic link token")
		Handle500(c)
		return
	}

	_, err = tokenCollection.DeleteMany(context.Background(), bson.M{"email": email})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to invalidate previous magic link tokens")
		Handle500(c)
		return
	}
	_, err = tokenCollection.InsertOne(context.Background(), &database.MagicLinkToken{
		Email:     email,
		TokenHash: hashMagicLinkToken(plaintext),
		RequestIP: requestIP,
		ExpiresAt: primitive.NewDateTimeFromTime(now.Add(time.Duration(constants.MAGIC_LINK_TTL_SECONDS) * time.Second)),
		CreatedAt: primitive.NewDateTimeFromTime(now),
	})
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to store magic link token")
		Handle500(c)
		return
	}

	loginURL := magicLinkCallbackURL(plaintext)
	if config.GetEnvironment() == config.Dev {
		api.Logger.Info().Msgf("magic link for %s: %s", email, loginURL)
		c.JSON(200, gin.H{"detail": "login link sent", "login_url": loginURL})
		return
	}

	subject := "Sign in to General Task"
	body := fmt.Sprintf("Use this link to sign in. It expires in 15 minutes.\n\n%s", loginURL)
	if err := api.sendLoginEmail(email, subject, body); err != nil {
		api.Logger.Error().Err(err).Msg("failed to send magic link email")
		Handle500(c)
		return
	}
	c.JSON(200, gin.H{"detail": "login link sent"})
}

// LoginEmailCallbackRedirect godoc
// @Summary      Opens email login confirmation
// @Description  Renders a confirmation form so automated link scanners do not consume the token
// @Tags         auth
// @Produce      html
// @Param        token  query  string  true  "magic link token"
// @Success      200 {object} string "confirmation page"
// @Router       /login/email/callback/ [get]
func (api *API) LoginEmailCallbackRedirect(c *gin.Context) {
	var params LoginEmailCallbackParams
	if c.ShouldBind(&params) != nil || params.Token == "" {
		c.Redirect(http.StatusFound, config.GetConfigValue("HOME_URL"))
		return
	}
	body := []byte(`<!DOCTYPE html>
<html>
<head>
	<title>Sign in to General Task</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
	<form method="post" action="/login/email/callback/">
		<input type="hidden" name="token" value="` + html.EscapeString(params.Token) + `" />
		<button type="submit">Sign in</button>
	</form>
</body>
</html>`)
	c.Data(http.StatusOK, "text/html; charset=utf-8", body)
}

// LoginEmailCallback godoc
// @Summary      Completes email login
// @Description  Consumes a one-time magic link token and sets the authToken cookie
// @Tags         auth
// @Produce      json
// @Param        token  formData  string  true  "magic link token"
// @Success      302 {object} string "URL redirect"
// @Failure      500 {object} string "internal server error"
// @Router       /login/email/callback/ [post]
func (api *API) LoginEmailCallback(c *gin.Context) {
	var params LoginEmailCallbackParams
	if c.ShouldBind(&params) != nil || params.Token == "" {
		c.Redirect(http.StatusFound, frontendLoginURL(url.Values{"email_login": {"invalid"}}))
		return
	}

	tokenCollection := database.GetMagicLinkTokenCollection(api.DB)
	var stored database.MagicLinkToken
	err := tokenCollection.FindOneAndDelete(
		context.Background(),
		bson.M{
			"token_hash": hashMagicLinkToken(params.Token),
			"expires_at": bson.M{"$gt": primitive.NewDateTimeFromTime(api.GetCurrentTime())},
		},
	).Decode(&stored)
	if err == mongo.ErrNoDocuments {
		c.Redirect(http.StatusFound, frontendLoginURL(url.Values{"email_login": {"invalid"}}))
		return
	}
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to consume magic link token")
		Handle500(c)
		return
	}

	user, isNew, err := database.FindOrCreateUserByEmail(api.DB, stored.Email)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find or create user for magic link")
		Handle500(c)
		return
	}

	api.completeLogin(c, user.ID, isNew, false)
}

func (api *API) sendLoginEmail(to, subject, body string) error {
	if api.SendEmail != nil {
		return api.SendEmail(to, subject, body)
	}
	return utils.SendMandrillEmail(to, subject, body)
}

func magicLinkCallbackURL(token string) string {
	return config.GetConfigValue("SERVER_URL") + "login/email/callback/?token=" + token
}

func frontendLoginURL(values url.Values) string {
	loginURL := strings.TrimRight(config.GetConfigValue("HOME_URL"), "/") + "/login"
	if len(values) == 0 {
		return loginURL
	}
	return loginURL + "?" + values.Encode()
}

func generateMagicLinkToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func hashMagicLinkToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
