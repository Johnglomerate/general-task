package jobs

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetSettingsOptions(t *testing.T) {
	t.Run("SuccessHourly", func(t *testing.T) {
		_, err := EnsureJobOnlyRunsOncePerHour("foobar")
		assert.NoError(t, err)
		_, err = EnsureJobOnlyRunsOncePerHour("foobar")
		assert.Error(t, err)
		_, err = EnsureJobOnlyRunsOncePerHour("foobar2")
		assert.NoError(t, err)
	})
}
