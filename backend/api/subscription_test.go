package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestIsUserSubscribed(t *testing.T) {
	t.Run("ActiveSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "active"}
		assert.True(t, isUserSubscribed(user))
	})
	t.Run("TrialingSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "trialing"}
		assert.True(t, isUserSubscribed(user))
	})
	t.Run("CanceledSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "canceled"}
		assert.False(t, isUserSubscribed(user))
	})
	t.Run("PastDueSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "past_due"}
		assert.False(t, isUserSubscribed(user))
	})
	t.Run("EmptySubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: ""}
		assert.False(t, isUserSubscribed(user))
	})
	t.Run("RandomStatus", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "unknown_status"}
		assert.False(t, isUserSubscribed(user))
	})
}

func TestSubscriptionStatusEndpoint(t *testing.T) {
	authToken := login("subscription_status_test@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/subscriptions/status/", nil)

	t.Run("NoSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "", result["subscription_status"])
		assert.Equal(t, false, result["is_subscribed"])
	})

	t.Run("ActiveSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"subscription_status":   "active",
				"subscription_id":       "sub_test123",
				"subscription_price_id": "price_test123",
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "active", result["subscription_status"])
		assert.Equal(t, "sub_test123", result["subscription_id"])
		assert.Equal(t, "price_test123", result["subscription_price_id"])
		assert.Equal(t, true, result["is_subscribed"])
	})

	t.Run("TrialingSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"subscription_status": "trialing",
				"subscription_id":     "sub_trial456",
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "trialing", result["subscription_status"])
		assert.Equal(t, true, result["is_subscribed"])
	})

	t.Run("CanceledSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"subscription_status": "canceled",
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "canceled", result["subscription_status"])
		assert.Equal(t, false, result["is_subscribed"])
	})
}

func TestStripeWebhookEndpoint(t *testing.T) {
	t.Run("EmptyBody", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		request, _ := http.NewRequest("POST", "/subscriptions/webhook/", bytes.NewBuffer([]byte("")))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid signature\"}", string(body))
	})

	t.Run("InvalidSignature", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		payload := []byte(`{"type": "checkout.session.completed"}`)
		request, _ := http.NewRequest("POST", "/subscriptions/webhook/", bytes.NewBuffer(payload))
		request.Header.Set("Stripe-Signature", "t=12345,v1=invalidsignature")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid signature\"}", string(body))
	})
}

func TestUpdateUserSubscription(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_test@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		// Set up stripe customer ID on the user
		stripeCustomerID := "cus_test_update_sub"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{"stripe_customer_id": stripeCustomerID}},
		)
		assert.NoError(t, err)

		// Update subscription
		err = updateUserSubscription(api, stripeCustomerID, "sub_123", "active")
		assert.NoError(t, err)

		// Verify the update
		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_123", user.SubscriptionID)
		assert.Equal(t, "active", user.SubscriptionStatus)
	})

	t.Run("UpdateToCanceled", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_cancel@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_cancel"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":  stripeCustomerID,
				"subscription_status": "active",
				"subscription_id":     "sub_456",
			}},
		)
		assert.NoError(t, err)

		// Cancel subscription
		err = updateUserSubscription(api, stripeCustomerID, "sub_456", "canceled")
		assert.NoError(t, err)

		// Verify the update
		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_456", user.SubscriptionID)
		assert.Equal(t, "canceled", user.SubscriptionStatus)
		assert.False(t, isUserSubscribed(&user))
	})

	t.Run("UpdateToPastDue", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_pastdue@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_pastdue"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":  stripeCustomerID,
				"subscription_status": "active",
				"subscription_id":     "sub_789",
			}},
		)
		assert.NoError(t, err)

		err = updateUserSubscription(api, stripeCustomerID, "sub_789", "past_due")
		assert.NoError(t, err)

		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "past_due", user.SubscriptionStatus)
		assert.False(t, isUserSubscribed(&user))
	})
}

func TestUpdateUserSubscriptionFull(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_full@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_full_update"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{"stripe_customer_id": stripeCustomerID}},
		)
		assert.NoError(t, err)

		periodEnd := primitive.NewDateTimeFromTime(time.Date(2026, 4, 15, 0, 0, 0, 0, time.UTC))
		err = updateUserSubscriptionFull(api, stripeCustomerID, "sub_full_123", "active", "price_test_full", periodEnd)
		assert.NoError(t, err)

		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_full_123", user.SubscriptionID)
		assert.Equal(t, "active", user.SubscriptionStatus)
		assert.Equal(t, "price_test_full", user.SubscriptionPriceID)
		assert.Equal(t, periodEnd, user.SubscriptionCurrentPeriodEnd)
	})

	t.Run("UpdateAllFields", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_full_all@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_full_all"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":              stripeCustomerID,
				"subscription_id":                 "sub_old",
				"subscription_status":             "trialing",
				"subscription_price_id":           "price_old",
				"subscription_current_period_end": primitive.NewDateTimeFromTime(time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)),
			}},
		)
		assert.NoError(t, err)

		newPeriodEnd := primitive.NewDateTimeFromTime(time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC))
		err = updateUserSubscriptionFull(api, stripeCustomerID, "sub_new", "active", "price_new", newPeriodEnd)
		assert.NoError(t, err)

		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_new", user.SubscriptionID)
		assert.Equal(t, "active", user.SubscriptionStatus)
		assert.Equal(t, "price_new", user.SubscriptionPriceID)
		assert.Equal(t, newPeriodEnd, user.SubscriptionCurrentPeriodEnd)
		assert.True(t, isUserSubscribed(&user))
	})
}

func TestGetOrCreateStripeCustomer(t *testing.T) {
	t.Run("ExistingCustomer", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		existingCustomerID := "cus_existing_12345"
		user := &database.User{
			ID:               primitive.NewObjectID(),
			Email:            "existing_customer@test.com",
			StripeCustomerID: existingCustomerID,
		}

		customerID, err := getOrCreateStripeCustomer(api, user)
		assert.NoError(t, err)
		assert.Equal(t, existingCustomerID, customerID)
	})
}

func TestSubscriptionConstants(t *testing.T) {
	assert.Equal(t, "active", SubscriptionStatusActive)
	assert.Equal(t, "trialing", SubscriptionStatusTrialing)
	assert.Equal(t, 2*time.Hour, SubscriptionRefreshCooldown)
}

func TestMaybeRefreshSubscriptionFromStripe(t *testing.T) {
	t.Run("NoStripeCustomerID", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		user := &database.User{
			ID:               primitive.NewObjectID(),
			StripeCustomerID: "",
		}

		refreshed, err := maybeRefreshSubscriptionFromStripe(api, user)
		assert.NoError(t, err)
		assert.False(t, refreshed)
	})

	t.Run("CooldownNotElapsed", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		now := time.Now()
		api.OverrideTime = &now

		// Set last refreshed to 1 hour ago (within the 2-hour cooldown)
		lastRefreshed := now.Add(-1 * time.Hour)
		user := &database.User{
			ID:                          primitive.NewObjectID(),
			StripeCustomerID:            "cus_test_cooldown",
			SubscriptionLastRefreshedAt: primitive.NewDateTimeFromTime(lastRefreshed),
		}

		refreshed, err := maybeRefreshSubscriptionFromStripe(api, user)
		assert.NoError(t, err)
		assert.False(t, refreshed)
	})

	t.Run("CooldownElapsed_StripeError_StillUpdatesTimestamp", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("refresh_stripe_error@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		now := time.Now()
		api.OverrideTime = &now

		// Set up user with a fake Stripe customer ID (will cause Stripe API error)
		// and last refreshed 3 hours ago (beyond cooldown)
		lastRefreshed := now.Add(-3 * time.Hour)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":             "cus_nonexistent_test_12345",
				"subscription_status":            "active",
				"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(lastRefreshed),
			}},
		)
		assert.NoError(t, err)

		var userObject database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&userObject)
		assert.NoError(t, err)

		// Call refresh — should attempt because cooldown has elapsed
		// With a fake customer ID, Stripe will either error or return no subscriptions
		_, _ = maybeRefreshSubscriptionFromStripe(api, &userObject)

		// Verify the timestamp was updated regardless of Stripe result
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.True(t, updatedUser.SubscriptionLastRefreshedAt.Time().After(lastRefreshed),
			"subscription_last_refreshed_at should be updated after refresh attempt")
	})

	t.Run("UnsetLastRefreshedAt_TriggersRefresh", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		// Directly insert a user with a Stripe customer ID but no last_refreshed_at
		// (avoids login() which may set the field via the request flow)
		userID := primitive.NewObjectID()
		_, err := database.GetUserCollection(api.DB).InsertOne(
			context.Background(),
			bson.M{
				"_id":                userID,
				"google_id":          "goog_unset_refresh_test",
				"email":              "refresh_unset_timestamp@generaltask.com",
				"stripe_customer_id": "cus_nonexistent_unset_test",
			},
		)
		assert.NoError(t, err)

		var userObject database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&userObject)
		assert.NoError(t, err)
		// primitive.DateTime(0) is the zero value when the field is absent in MongoDB.
		// Note: primitive.DateTime(0).Time() is Unix epoch (1970), NOT Go's time.Time zero (year 1),
		// so we check the raw primitive.DateTime value instead of .Time().IsZero().
		assert.Equal(t, primitive.DateTime(0), userObject.SubscriptionLastRefreshedAt,
			"precondition: last_refreshed_at should be unset/zero")

		// Call refresh — should proceed because lastRefreshed is effectively unset
		_, _ = maybeRefreshSubscriptionFromStripe(api, &userObject)

		// Verify the timestamp was set to a real value
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.NotEqual(t, primitive.DateTime(0), updatedUser.SubscriptionLastRefreshedAt,
			"subscription_last_refreshed_at should be set after refresh")
	})

	t.Run("CooldownExactlyAtBoundary", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		now := time.Now()
		api.OverrideTime = &now

		// Set last refreshed to exactly 2 hours ago (at the boundary)
		lastRefreshed := now.Add(-SubscriptionRefreshCooldown)
		user := &database.User{
			ID:                          primitive.NewObjectID(),
			StripeCustomerID:            "cus_test_boundary",
			SubscriptionLastRefreshedAt: primitive.NewDateTimeFromTime(lastRefreshed),
		}

		// At exactly the boundary, now.Sub(lastRefreshed) == SubscriptionRefreshCooldown,
		// which is NOT < SubscriptionRefreshCooldown, so refresh should be attempted.
		// We can't fully test this without Stripe, but we verify the cooldown check passes
		// by confirming it doesn't short-circuit (it will proceed to call Stripe and may error).
		// The function doesn't short-circuit, so it returns either (true, nil) or (false, err).
		refreshed, err := maybeRefreshSubscriptionFromStripe(api, user)
		// With a fake customer ID and no DB record, the function will fail at the Stripe call
		// or the DB update. The key assertion is that it didn't return (false, nil) from the
		// cooldown check.
		if err == nil {
			assert.True(t, refreshed, "at exactly 2h boundary, refresh should be attempted")
		}
		// If err != nil, that's fine — it means it tried to call Stripe (passed the cooldown)
	})
}

func TestSubscriptionStatusEndpoint_WithRefresh(t *testing.T) {
	t.Run("RefreshTriggeredWhenCooldownElapsed", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("status_refresh_test@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		now := time.Now()
		api.OverrideTime = &now

		// Set up user with a Stripe customer ID and old refresh time
		oldRefresh := now.Add(-3 * time.Hour)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":             "cus_test_status_refresh",
				"subscription_status":            "active",
				"subscription_id":                "sub_test_status",
				"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(oldRefresh),
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		// Should still return 200 even if Stripe call fails
		assert.Equal(t, http.StatusOK, recorder.Code)

		// Verify the timestamp was updated (refresh was attempted)
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.True(t, updatedUser.SubscriptionLastRefreshedAt.Time().After(oldRefresh),
			"timestamp should be updated after status endpoint triggers refresh")
	})

	t.Run("NoRefreshWhenCooldownActive", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("status_no_refresh@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		now := time.Now()
		api.OverrideTime = &now

		// Set last refreshed to 30 minutes ago (within cooldown)
		recentRefresh := now.Add(-30 * time.Minute)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":             "cus_test_no_refresh",
				"subscription_status":            "active",
				"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(recentRefresh),
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)

		// Verify the timestamp was NOT updated (cooldown still active)
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.Equal(t, primitive.NewDateTimeFromTime(recentRefresh), updatedUser.SubscriptionLastRefreshedAt,
			"timestamp should not change when cooldown is active")
	})
}

func TestSubscriptionMiddleware_WithRefresh(t *testing.T) {
	t.Run("UnsubscribedUserTriggersRefresh", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("middleware_unsub_refresh@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		now := time.Now()
		api.OverrideTime = &now

		// User with expired subscription and old refresh time
		oldRefresh := now.Add(-3 * time.Hour)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":             "cus_middleware_unsub",
				"subscription_status":            "canceled",
				"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(oldRefresh),
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/ping_subscribed/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		// User will still be rejected (fake Stripe ID returns no real subscription)
		assert.Equal(t, http.StatusForbidden, recorder.Code)

		// But the refresh timestamp should have been updated
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.True(t, updatedUser.SubscriptionLastRefreshedAt.Time().After(oldRefresh),
			"middleware should trigger refresh when cooldown elapsed")
	})

	t.Run("SubscribedUserTriggersRefresh", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("middleware_sub_refresh@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		now := time.Now()
		api.OverrideTime = &now

		// User with active subscription and old refresh time
		oldRefresh := now.Add(-3 * time.Hour)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":             "cus_middleware_sub",
				"subscription_status":            "active",
				"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(oldRefresh),
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/ping_subscribed/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		// Verify the refresh timestamp was updated even for subscribed user
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.True(t, updatedUser.SubscriptionLastRefreshedAt.Time().After(oldRefresh),
			"middleware should trigger refresh for subscribed users when cooldown elapsed")
	})

	t.Run("NoRefreshWhenCooldownActive", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("middleware_no_refresh@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		now := time.Now()
		api.OverrideTime = &now

		// User with active subscription and recent refresh
		recentRefresh := now.Add(-30 * time.Minute)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":             "cus_middleware_no_refresh",
				"subscription_status":            "active",
				"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(recentRefresh),
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/ping_subscribed/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		// Should be allowed through (active subscription, no refresh needed)
		assert.Equal(t, http.StatusOK, recorder.Code)

		// Verify the timestamp was NOT updated
		var updatedUser database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.Equal(t, primitive.NewDateTimeFromTime(recentRefresh), updatedUser.SubscriptionLastRefreshedAt,
			"timestamp should not change when cooldown is active in middleware")
	})
}
