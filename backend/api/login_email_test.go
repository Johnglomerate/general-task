package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestLoginEmailRequest(t *testing.T) {
	t.Run("EmptyPayload", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("POST", "/login/email/", nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or missing 'email' parameter.\"}", string(body))
	})
	t.Run("MissingEmail", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("POST", "/login/email/", bytes.NewBuffer([]byte(`{"foo":"bar"}`)))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("BadEmail", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)
		request, _ := http.NewRequest("POST", "/login/email/", bytes.NewBuffer([]byte(`{"email":"not-an-email"}`)))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid email format.\"}", string(body))
	})
	t.Run("SuccessUnknownEmail", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		loginURL := requestMagicLink(t, api, email)

		var stored database.MagicLinkToken
		err := database.GetMagicLinkTokenCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"email": email},
		).Decode(&stored)
		assert.NoError(t, err)
		assert.Equal(t, email, stored.Email)
		assert.NotEmpty(t, stored.TokenHash)
		token := tokenFromLoginURL(t, loginURL)
		assert.NotEqual(t, token, stored.TokenHash)
		assert.Equal(t, hashMagicLinkToken(token), stored.TokenHash)

		count, err := database.GetUserCollection(api.DB).CountDocuments(context.Background(), database.EmailLookupFilter(email))
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("ReplacesPreviousToken", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		firstURL := requestMagicLink(t, api, email)
		secondURL := requestMagicLink(t, api, email)
		assert.NotEqual(t, firstURL, secondURL)

		count, err := database.GetMagicLinkTokenCollection(api.DB).CountDocuments(context.Background(), bson.M{"email": email})
		assert.NoError(t, err)
		assert.Equal(t, int64(1), count)

		recorder := getMagicLinkCallback(api, tokenFromLoginURL(t, firstURL))
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
	})
	t.Run("NormalizesEmail", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		local := strings.Split(createRandomGTEmail(), "@")[0]
		requestMagicLink(t, api, local+"@GeneralTask.com")
		var stored database.MagicLinkToken
		err := database.GetMagicLinkTokenCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"email": local + "@generaltask.com"},
		).Decode(&stored)
		assert.NoError(t, err)
	})
}

func TestLoginEmailCallback(t *testing.T) {
	t.Run("MissingToken", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		recorder := getMagicLinkCallback(api, "")
		assert.Equal(t, http.StatusFound, recorder.Code)
		assert.Equal(t, config.GetConfigValue("HOME_URL"), recorder.Header().Get("Location"))
	})
	t.Run("InvalidToken", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		recorder := getMagicLinkCallback(api, "deadbeef")
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid or expired login link\"}", string(body))
	})
	t.Run("NewUser", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		loginURL := requestMagicLink(t, api, email)
		recorder := getMagicLinkCallback(api, tokenFromLoginURL(t, loginURL))
		assert.Equal(t, http.StatusFound, recorder.Code)
		assert.Equal(t, "http://localhost:3000/tos-summary", recorder.Header().Get("Location"))
		assert.NotEmpty(t, authTokenFromRecorder(t, recorder))

		user, err := database.FindOldestUserByEmail(api.DB, email)
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, email, user.Email)
		assert.Equal(t, "", user.GoogleID)

		count, err := database.GetTaskCollection(api.DB).CountDocuments(context.Background(), bson.M{"user_id": user.ID})
		assert.NoError(t, err)
		assert.Equal(t, int64(5), count)
	})
	t.Run("ExistingGoogleUser", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		inserted, err := database.GetUserCollection(api.DB).InsertOne(context.Background(), &database.User{
			GoogleID:  "google-" + email,
			Email:     email,
			Name:      "Existing",
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-time.Hour)),
		})
		assert.NoError(t, err)

		loginURL := requestMagicLink(t, api, strings.ToUpper(email[:1])+email[1:])
		recorder := getMagicLinkCallback(api, tokenFromLoginURL(t, loginURL))
		assert.Equal(t, http.StatusFound, recorder.Code)
		assert.Equal(t, "http://localhost:3000/", recorder.Header().Get("Location"))

		user, err := database.FindOldestUserByEmail(api.DB, email)
		assert.NoError(t, err)
		assert.Equal(t, inserted.InsertedID, user.ID)
		assert.Equal(t, "google-"+email, user.GoogleID)
	})
	t.Run("PrefersOldestWhenEmailsCollide", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		older, err := database.GetUserCollection(api.DB).InsertOne(context.Background(), &database.User{
			GoogleID:  "older-" + email,
			Email:     email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-2 * time.Hour)),
		})
		assert.NoError(t, err)
		_, err = database.GetUserCollection(api.DB).InsertOne(context.Background(), &database.User{
			GoogleID:  "newer-" + email,
			Email:     email,
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC()),
		})
		assert.NoError(t, err)

		loginURL := requestMagicLink(t, api, email)
		recorder := getMagicLinkCallback(api, tokenFromLoginURL(t, loginURL))
		assert.Equal(t, http.StatusFound, recorder.Code)

		authToken := authTokenFromRecorder(t, recorder)
		loggedInID := getUserIDFromAuthToken(t, api.DB, authToken)
		assert.Equal(t, older.InsertedID, loggedInID)
	})
	t.Run("ExpiredToken", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		plaintext, err := generateMagicLinkToken()
		assert.NoError(t, err)
		_, err = database.GetMagicLinkTokenCollection(api.DB).InsertOne(context.Background(), &database.MagicLinkToken{
			Email:     email,
			TokenHash: hashMagicLinkToken(plaintext),
			ExpiresAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-time.Minute)),
			CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-20 * time.Minute)),
		})
		assert.NoError(t, err)

		recorder := getMagicLinkCallback(api, plaintext)
		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		count, err := database.GetUserCollection(api.DB).CountDocuments(context.Background(), database.EmailLookupFilter(email))
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
	})
	t.Run("CannotReuse", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		email := createRandomGTEmail()
		loginURL := requestMagicLink(t, api, email)
		token := tokenFromLoginURL(t, loginURL)
		first := getMagicLinkCallback(api, token)
		assert.Equal(t, http.StatusFound, first.Code)
		second := getMagicLinkCallback(api, token)
		assert.Equal(t, http.StatusBadRequest, second.Code)
	})
	t.Run("ProdSendUsesInjectedSender", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		var sentTo, sentSubject, sentBody string
		api.SendEmail = func(to, subject, body string) error {
			sentTo = to
			sentSubject = subject
			sentBody = body
			return nil
		}
		t.Setenv("ENVIRONMENT", "prod")

		email := createRandomGTEmail()
		router := GetRouter(api)
		payload, err := json.Marshal(map[string]string{"email": email})
		assert.NoError(t, err)
		request, _ := http.NewRequest("POST", "/login/email/", bytes.NewBuffer(payload))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		assert.Equal(t, http.StatusOK, recorder.Code)
		var response map[string]string
		assert.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &response))
		assert.Equal(t, "login link sent", response["detail"])
		assert.Empty(t, response["login_url"])
		assert.Equal(t, email, sentTo)
		assert.Equal(t, "Sign in to General Task", sentSubject)
		assert.Contains(t, sentBody, "/login/email/callback/?token=")
	})
}

func TestGoogleLoginMergesEmailOnlyUser(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	email := createRandomGTEmail()
	inserted, err := database.GetUserCollection(api.DB).InsertOne(context.Background(), &database.User{
		Email:     email,
		Name:      "Magic",
		CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-time.Hour)),
	})
	assert.NoError(t, err)

	stateToken, err := newStateToken(api.DB, "", false)
	assert.NoError(t, err)
	recorder := makeLoginCallbackRequest("noice420", email, "From Google", *stateToken, *stateToken, false, true)
	assert.Equal(t, http.StatusFound, recorder.Code)
	assert.Equal(t, "http://localhost:3000/", recorder.Header().Get("Location"))

	var user database.User
	err = database.GetUserCollection(api.DB).FindOne(context.Background(), bson.M{"_id": inserted.InsertedID}).Decode(&user)
	assert.NoError(t, err)
	assert.Equal(t, "goog12345_"+email, user.GoogleID)
	assert.Equal(t, "From Google", user.Name)

	count, err := database.GetUserCollection(api.DB).CountDocuments(context.Background(), database.EmailLookupFilter(email))
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

func TestGoogleLoginDoesNotMergeDistinctGoogleUsers(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	email := createRandomGTEmail()
	_, err := database.GetUserCollection(api.DB).InsertOne(context.Background(), &database.User{
		Email:     email,
		GoogleID:  "already-google",
		CreatedAt: primitive.NewDateTimeFromTime(time.Now().UTC().Add(-time.Hour)),
	})
	assert.NoError(t, err)

	stateToken, err := newStateToken(api.DB, "", false)
	assert.NoError(t, err)
	recorder := makeLoginCallbackRequest("noice420", email, "Other Google", *stateToken, *stateToken, false, true)
	assert.Equal(t, http.StatusFound, recorder.Code)

	count, err := database.GetUserCollection(api.DB).CountDocuments(context.Background(), database.EmailLookupFilter(email))
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)

	var created database.User
	err = database.GetUserCollection(api.DB).FindOne(context.Background(), bson.M{"google_id": "goog12345_" + email}).Decode(&created)
	assert.NoError(t, err)
	assert.NotEqual(t, "already-google", created.GoogleID)
}

func requestMagicLink(t *testing.T, api *API, email string) string {
	router := GetRouter(api)
	payload, err := json.Marshal(map[string]string{"email": email})
	assert.NoError(t, err)
	request, _ := http.NewRequest("POST", "/login/email/", bytes.NewBuffer(payload))
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusOK, recorder.Code)
	var response map[string]string
	assert.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &response))
	assert.Equal(t, "login link sent", response["detail"])
	assert.NotEmpty(t, response["login_url"])
	return response["login_url"]
}

func getMagicLinkCallback(api *API, token string) *httptest.ResponseRecorder {
	router := GetRouter(api)
	path := "/login/email/callback/"
	if token != "" {
		path += "?token=" + url.QueryEscape(token)
	}
	request, _ := http.NewRequest("GET", path, nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func tokenFromLoginURL(t *testing.T, loginURL string) string {
	parsed, err := url.Parse(loginURL)
	assert.NoError(t, err)
	token := parsed.Query().Get("token")
	assert.NotEmpty(t, token)
	return token
}

func authTokenFromRecorder(t *testing.T, recorder *httptest.ResponseRecorder) string {
	for _, cookie := range recorder.Result().Cookies() {
		if cookie.Name == "authToken" {
			assert.NotEmpty(t, cookie.Value)
			return cookie.Value
		}
	}
	t.Fatal("missing authToken cookie")
	return ""
}
