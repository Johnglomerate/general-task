package api

import (
	"github.com/gin-gonic/gin"
)

func (api *API) ShareableTaskPreview(c *gin.Context) {
	body := []byte(`
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
</html>`)
	c.Data(410, "text/html; charset=utf-8", body)
}
