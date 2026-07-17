package external

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
)

func TestGetGoogleConfig(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		googleConfig := getGoogleLoginConfig()
		assert.Equal(
			t,
			"https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=786163085684-uvopl20u17kp4p2vd951odnm6f89f2f6.apps.googleusercontent.com&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin%2Fcallback%2F&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&state=state-token",
			googleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce),
		)
		includeGrantedScopes := oauth2.SetAuthURLParam("include_granted_scopes", "false")
		assert.Equal(
			t,
			"https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=786163085684-uvopl20u17kp4p2vd951odnm6f89f2f6.apps.googleusercontent.com&include_granted_scopes=false&prompt=consent&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin%2Fcallback%2F&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&state=state-token",
			googleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline, includeGrantedScopes, oauth2.ApprovalForce),
		)
	})
}

func TestRevokeGoogleToken(t *testing.T) {
	newServer := func(statusCode int, body string) (*httptest.Server, *url.Values) {
		received := url.Values{}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_ = r.ParseForm()
			received = r.Form
			w.WriteHeader(statusCode)
			w.Write([]byte(body)) //nolint:errcheck
		}))
		return server, &received
	}

	t.Run("PrefersRefreshToken", func(t *testing.T) {
		server, received := newServer(http.StatusOK, "")
		defer server.Close()
		err := RevokeGoogleToken(`{"access_token":"access","refresh_token":"refresh"}`, &server.URL)
		assert.NoError(t, err)
		assert.Equal(t, "refresh", received.Get("token"))
	})
	t.Run("FallsBackToAccessToken", func(t *testing.T) {
		server, received := newServer(http.StatusOK, "")
		defer server.Close()
		err := RevokeGoogleToken(`{"access_token":"access"}`, &server.URL)
		assert.NoError(t, err)
		assert.Equal(t, "access", received.Get("token"))
	})
	t.Run("AlreadyRevokedIsSuccess", func(t *testing.T) {
		// Google answers 400 invalid_token when the grant is already gone, which
		// is the outcome the caller wanted anyway.
		server, _ := newServer(http.StatusBadRequest, `{"error":"invalid_token"}`)
		defer server.Close()
		err := RevokeGoogleToken(`{"refresh_token":"refresh"}`, &server.URL)
		assert.NoError(t, err)
	})
	t.Run("OtherErrorIsFailure", func(t *testing.T) {
		server, _ := newServer(http.StatusInternalServerError, "boom")
		defer server.Close()
		err := RevokeGoogleToken(`{"refresh_token":"refresh"}`, &server.URL)
		assert.Error(t, err)
	})
	t.Run("NoTokenToRevoke", func(t *testing.T) {
		server, _ := newServer(http.StatusOK, "")
		defer server.Close()
		err := RevokeGoogleToken(`{}`, &server.URL)
		assert.Error(t, err)
	})
	t.Run("MalformedToken", func(t *testing.T) {
		err := RevokeGoogleToken(`not json`, nil)
		assert.Error(t, err)
	})
}
