package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/stripe/stripe-go/v76/webhook"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	SubscriptionStatusActive    = "active"
	SubscriptionStatusTrialing  = "trialing"
	TrialPeriodDays             = 67
	SubscriptionRefreshCooldown = 2 * time.Hour
)

func init() {
	stripe.Key = config.GetConfigValue("STRIPE_SECRET_KEY")
}

// SubscriptionStatus godoc
// @Summary      Returns the user's subscription status
// @Description  Returns subscription status, plan, and expiry
// @Tags         subscription
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} string "internal server error"
// @Router       /subscriptions/status/ [get]
func (api *API) SubscriptionStatus(c *gin.Context) {
	userID := getUserIDFromContext(c)
	userCollection := database.GetUserCollection(api.DB)
	var userObject database.User
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user for subscription status")
		Handle500(c)
		return
	}

	// Refresh subscription from Stripe if cooldown has elapsed
	refreshed, err := maybeRefreshSubscriptionFromStripe(api, &userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to refresh subscription from stripe")
	}
	if refreshed {
		// Re-read the user to get the updated subscription fields
		err = userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
		if err != nil {
			api.Logger.Error().Err(err).Msg("failed to re-read user after subscription refresh")
			Handle500(c)
			return
		}
	}

	c.JSON(200, gin.H{
		"subscription_status":             userObject.SubscriptionStatus,
		"subscription_id":                 userObject.SubscriptionID,
		"subscription_price_id":           userObject.SubscriptionPriceID,
		"subscription_current_period_end": userObject.SubscriptionCurrentPeriodEnd,
		"is_subscribed":                   isUserSubscribed(&userObject),
	})
}

// StripeWebhook godoc
// @Summary      Handles Stripe webhook events
// @Description  Processes subscription lifecycle events from Stripe
// @Tags         subscription
// @Success      200 {object} string
// @Failure      400 {object} string "bad request"
// @Router       /subscriptions/webhook/ [post]
func (api *API) StripeWebhook(c *gin.Context) {
	logger := logging.GetSentryLogger()

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read webhook body")
		c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to read body"})
		return
	}

	webhookSecret := config.GetConfigValue("STRIPE_WEBHOOK_SECRET")
	event, err := webhook.ConstructEventWithOptions(body, c.Request.Header.Get("Stripe-Signature"), webhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		logger.Error().Err(err).Msg("failed to verify webhook signature")
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid signature"})
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &session)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal checkout session")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		if session.Subscription != nil {
			err = updateUserSubscription(api, session.Customer.ID, session.Subscription.ID, SubscriptionStatusActive)
			if err != nil {
				logger.Error().Err(err).Msg("failed to update subscription after checkout")
			}
		}

	case "customer.subscription.updated":
		var subscription stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &subscription)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal subscription update")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		priceID := ""
		if len(subscription.Items.Data) > 0 {
			priceID = subscription.Items.Data[0].Price.ID
		} else {
			logger.Warn().Str("subscription_id", subscription.ID).Msg("subscription update received with no line items")
		}
		periodEnd := primitive.NewDateTimeFromTime(time.Unix(subscription.CurrentPeriodEnd, 0))
		err = updateUserSubscriptionFull(api, subscription.Customer.ID, subscription.ID, string(subscription.Status), priceID, periodEnd)
		if err != nil {
			logger.Error().Err(err).Msg("failed to update subscription")
		}

	case "customer.subscription.deleted":
		var subscription stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &subscription)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal subscription deletion")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		err = updateUserSubscription(api, subscription.Customer.ID, subscription.ID, "canceled")
		if err != nil {
			logger.Error().Err(err).Msg("failed to update subscription after deletion")
		}

	case "invoice.payment_failed":
		var invoice stripe.Invoice
		err := json.Unmarshal(event.Data.Raw, &invoice)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal invoice")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		if invoice.Subscription != nil {
			err = updateUserSubscription(api, invoice.Customer.ID, invoice.Subscription.ID, "past_due")
			if err != nil {
				logger.Error().Err(err).Msg("failed to update subscription after payment failure")
			}
		}
	}

	c.JSON(200, gin.H{"received": true})
}

// getOrCreateStripeCustomer ensures the user has a Stripe customer record
func getOrCreateStripeCustomer(api *API, user *database.User) (string, error) {
	if user.StripeCustomerID != "" {
		return user.StripeCustomerID, nil
	}
	params := &stripe.CustomerParams{
		Email: stripe.String(user.Email),
		Name:  stripe.String(user.Name),
	}
	params.AddMetadata("general_task_user_id", user.ID.Hex())

	cust, err := customer.New(params)
	if err != nil {
		return "", err
	}

	userCollection := database.GetUserCollection(api.DB)
	_, err = userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"stripe_customer_id": cust.ID}},
	)
	if err != nil {
		return "", err
	}

	return cust.ID, nil
}

// updateUserSubscription updates basic subscription status by Stripe customer ID
func updateUserSubscription(api *API, stripeCustomerID string, subscriptionID string, status string) error {
	userCollection := database.GetUserCollection(api.DB)
	_, err := userCollection.UpdateOne(
		context.Background(),
		bson.M{"stripe_customer_id": stripeCustomerID},
		bson.M{"$set": bson.M{
			"subscription_id":     subscriptionID,
			"subscription_status": status,
		}},
	)
	return err
}

// updateUserSubscriptionFull updates all subscription fields by Stripe customer ID
func updateUserSubscriptionFull(api *API, stripeCustomerID string, subscriptionID string, status string, priceID string, periodEnd primitive.DateTime) error {
	userCollection := database.GetUserCollection(api.DB)
	_, err := userCollection.UpdateOne(
		context.Background(),
		bson.M{"stripe_customer_id": stripeCustomerID},
		bson.M{"$set": bson.M{
			"subscription_id":                 subscriptionID,
			"subscription_status":             status,
			"subscription_price_id":           priceID,
			"subscription_current_period_end": periodEnd,
		}},
	)
	return err
}

// isUserSubscribed checks if a user has an active or trialing subscription
func isUserSubscribed(user *database.User) bool {
	return user.SubscriptionStatus == SubscriptionStatusActive || user.SubscriptionStatus == SubscriptionStatusTrialing
}

// maybeRefreshSubscriptionFromStripe checks if the subscription cooldown has
// elapsed and, if so, fetches the latest subscription state from Stripe and
// persists it. Returns true if a refresh was performed.
func maybeRefreshSubscriptionFromStripe(api *API, user *database.User) (bool, error) {
	if user.StripeCustomerID == "" {
		return false, nil
	}

	now := api.GetCurrentTime()
	lastRefreshed := user.SubscriptionLastRefreshedAt.Time()
	if !lastRefreshed.IsZero() && now.Sub(lastRefreshed) < SubscriptionRefreshCooldown {
		return false, nil
	}

	logger := logging.GetSentryLogger()

	// List active/trialing subscriptions for this customer
	params := &stripe.SubscriptionListParams{}
	params.Customer = stripe.String(user.StripeCustomerID)
	params.Filters.AddFilter("limit", "", "1")

	iter := subscription.List(params)

	userCollection := database.GetUserCollection(api.DB)
	updateFields := bson.M{
		"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(now),
	}

	if iter.Next() {
		stripeSub := iter.Subscription()
		newStatus := string(stripeSub.Status)
		newSubID := stripeSub.ID
		newPriceID := ""
		if len(stripeSub.Items.Data) > 0 {
			newPriceID = stripeSub.Items.Data[0].Price.ID
		}
		newPeriodEnd := primitive.NewDateTimeFromTime(time.Unix(stripeSub.CurrentPeriodEnd, 0))

		// Log at error level if any field was modified — this means webhooks missed an update
		if user.SubscriptionID != newSubID {
			logger.Error().Str("user_id", user.ID.Hex()).Str("old", user.SubscriptionID).Str("new", newSubID).Msg("subscription refresh changed subscription_id — webhook may have failed")
		}
		if user.SubscriptionStatus != newStatus {
			logger.Error().Str("user_id", user.ID.Hex()).Str("old", user.SubscriptionStatus).Str("new", newStatus).Msg("subscription refresh changed subscription_status — webhook may have failed")
		}
		if user.SubscriptionPriceID != newPriceID {
			logger.Error().Str("user_id", user.ID.Hex()).Str("old", user.SubscriptionPriceID).Str("new", newPriceID).Msg("subscription refresh changed subscription_price_id — webhook may have failed")
		}
		if user.SubscriptionCurrentPeriodEnd != newPeriodEnd {
			logger.Error().Str("user_id", user.ID.Hex()).Msg("subscription refresh changed subscription_current_period_end — webhook may have failed")
		}

		updateFields["subscription_id"] = newSubID
		updateFields["subscription_status"] = newStatus
		if newPriceID != "" {
			updateFields["subscription_price_id"] = newPriceID
		}
		updateFields["subscription_current_period_end"] = newPeriodEnd

		logger.Info().Str("user_id", user.ID.Hex()).Str("status", newStatus).Msg("refreshed subscription from stripe")
	} else {
		// No active subscription found — mark as canceled if it was previously set
		if user.SubscriptionStatus != "" && user.SubscriptionStatus != "canceled" {
			logger.Error().Str("user_id", user.ID.Hex()).Str("old", user.SubscriptionStatus).Str("new", "canceled").Msg("subscription refresh changed subscription_status — webhook may have failed")
			updateFields["subscription_status"] = "canceled"
		}
		logger.Info().Str("user_id", user.ID.Hex()).Msg("no active subscription found on stripe refresh")
	}

	if err := iter.Err(); err != nil {
		logger.Error().Err(err).Str("user_id", user.ID.Hex()).Msg("stripe subscription list error")
		// Still update the timestamp so we don't hammer Stripe on repeated failures
		_, updateErr := userCollection.UpdateOne(
			context.Background(),
			bson.M{"_id": user.ID},
			bson.M{"$set": bson.M{"subscription_last_refreshed_at": primitive.NewDateTimeFromTime(now)}},
		)
		if updateErr != nil {
			logger.Error().Err(updateErr).Msg("failed to update refresh timestamp after stripe error")
		}
		return false, err
	}

	_, err := userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		return false, err
	}

	return true, nil
}
