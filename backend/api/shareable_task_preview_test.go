package api

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestShareableTaskPreview(t *testing.T) {
	api, dbCleanup := GetAPIWithDBCleanup()
	defer dbCleanup()
	router := GetRouter(api)

	expectedBody := `
<!DOCTYPE html>
<html>
<head>
	<title>Shared task unavailable</title>
	<meta property="og:title" content="Shared task unavailable" />
	<meta name="twitter:title" content="Shared task unavailable">
	<meta content="Shared tasks are no longer available." property="og:description">
	<meta content="Shared tasks are no longer available." property="twitter:description">
	<meta property="og:type" content="website" />
</head>
<body>
	Shared tasks are no longer available.
</body>
</html>`

	request, _ := http.NewRequest(
		"GET",
		fmt.Sprintf("/shareable_tasks/%s/", primitive.NewObjectID().Hex()),
		nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	assert.Equal(t, http.StatusGone, recorder.Code)
	body, err := io.ReadAll(recorder.Body)
	assert.NoError(t, err)
	assert.Equal(t, expectedBody, string(body))
}
