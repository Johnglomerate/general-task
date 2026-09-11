package api

import (
	"github.com/gin-gonic/gin"
)

func (api *API) NotePreview(c *gin.Context) {
	body := []byte(`
<!DOCTYPE html>
<html>
<head>
	<title>Shared note unavailable</title>
	<meta property="og:title" content="Shared note unavailable" />
	<meta name="twitter:title" content="Shared note unavailable">
	<meta content="Shared notes are no longer available." property="og:description">
	<meta content="Shared notes are no longer available." property="twitter:description">
	<meta property="og:type" content="website" />
</head>
<body>
	Shared notes are no longer available.
</body>
</html>`)
	c.Data(410, "text/html; charset=utf-8", body)
}
