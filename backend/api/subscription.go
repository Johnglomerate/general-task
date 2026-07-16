package api

import (
	"context"
	"encoding/json"
	"io"
	"math"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/webhook"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	SubscriptionStatusActive   = "active"
	SubscriptionStatusTrialing = "trialing"
	TrialPeriodDays            = 67
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

	// Users with no signup time have no meaningful trial window, so report a null end date rather
	// than an epoch-derived one
	var trialEnd *primitive.DateTime
	if userObject.CreatedAt != 0 {
		endsAt := primitive.NewDateTimeFromTime(trialEndsAt(&userObject))
		trialEnd = &endsAt
	}

	c.JSON(200, gin.H{
		"subscription_status":             userObject.SubscriptionStatus,
		"subscription_id":                 userObject.SubscriptionID,
		"subscription_price_id":           userObject.SubscriptionPriceID,
		"subscription_current_period_end": userObject.SubscriptionCurrentPeriodEnd,
		"is_subscribed":                   isUserSubscribed(&userObject),
		"is_in_trial":                     isUserInFreeTrial(&userObject),
		"trial_days_remaining":            trialDaysRemaining(&userObject),
		"trial_ends_at":                   trialEnd,
		"has_product_access":              hasProductAccess(&userObject),
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

// trialEndsAt returns the moment the user's free trial expires. The trial starts at signup, so it is
// derived from CreatedAt, which is only ever written on user insert.
func trialEndsAt(user *database.User) time.Time {
	return user.CreatedAt.Time().UTC().AddDate(0, 0, TrialPeriodDays)
}

// isUserInFreeTrial checks whether the user is still within the free trial granted at signup.
// Users with no CreatedAt predate the field and are treated as having no trial left.
func isUserInFreeTrial(user *database.User) bool {
	if user.CreatedAt == 0 {
		return false
	}
	return time.Now().UTC().Before(trialEndsAt(user))
}

// trialDaysRemaining returns whole days left in the free trial, rounded up so that a trial with any
// time left always reads as at least 1 day. Returns 0 once the trial has ended.
func trialDaysRemaining(user *database.User) int {
	if !isUserInFreeTrial(user) {
		return 0
	}
	return int(math.Ceil(time.Until(trialEndsAt(user)).Hours() / 24))
}

// hasProductAccess checks whether the user may use the paid product, either by paying or by still
// being inside the free trial that starts at signup.
func hasProductAccess(user *database.User) bool {
	return isUserSubscribed(user) || isUserInFreeTrial(user)
}
