package database

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// https://www.mongodb.com/blog/post/quick-start-golang--mongodb--modeling-documents-with-go-data-structures

// User model
type User struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty"`
	GoogleID              string             `bson:"google_id"`
	Email                 string             `bson:"email"`
	Name                  string             `bson:"name"`
	LastRefreshed         primitive.DateTime `bson:"last_refreshed,omitempty"`
	AgreedToTerms         *bool              `bson:"agreed_to_terms,omitempty"`
	OptedIntoMarketing    *bool              `bson:"opted_into_marketing,omitempty"`
	CreatedAt             primitive.DateTime `bson:"created_at,omitempty"`
	GPTSuggestionsLeft    int                `bson:"gpt_suggestions_left"`
	GPTLastSuggestionTime primitive.DateTime `bson:"gpt_last_suggestion_time"`
	// Stripe subscription fields
	StripeCustomerID           string             `bson:"stripe_customer_id,omitempty"`
	SubscriptionID             string             `bson:"subscription_id,omitempty"`
	SubscriptionStatus         string             `bson:"subscription_status,omitempty"`
	SubscriptionPriceID        string             `bson:"subscription_price_id,omitempty"`
	SubscriptionCurrentPeriodEnd primitive.DateTime `bson:"subscription_current_period_end,omitempty"`
}

type UserChangeable struct {
	Email             string             `bson:"email,omitempty"`
	Name              string             `bson:"name,omitempty"`
	LastRefreshed     primitive.DateTime `bson:"last_refreshed,omitempty"`
}

// InternalAPIToken model
type InternalAPIToken struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	Token  string             `bson:"token"`
	UserID primitive.ObjectID `bson:"user_id"`
}

// ExternalAPIToken model
type ExternalAPIToken struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty"`
	ServiceID           string             `bson:"service_id"`
	Token               string             `bson:"token"`
	UserID              primitive.ObjectID `bson:"user_id"`
	AccountID           string             `bson:"account_id"`
	DisplayID           string             `bson:"display_id"`
	IsUnlinkable        bool               `bson:"is_unlinkable"`
	IsPrimaryLogin      bool               `bson:"is_primary_login"`
	IsBadToken          bool               `bson:"is_bad_token"`
	ExternalID          string             `bson:"external_id"`
	LastFullRefreshTime primitive.DateTime `bson:"last_full_refresh_time"`
	Scopes              []string           `bson:"scopes"`
	Timezone            string             `bson:"timezone"`
}

type StateToken struct {
	Token       primitive.ObjectID `bson:"_id,omitempty"`
	UserID      primitive.ObjectID `bson:"user_id"`
	UseDeeplink bool               `bson:"use_deeplink"`
}

type Oauth1RequestSecret struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	RequestSecret string             `bson:"request_secret"`
}

type SharedAccess int

const (
	SharedAccessPublic SharedAccess = iota
	SharedAccessDomain
	SharedAccessMeetingAttendees
)

type Task struct {
	ID     primitive.ObjectID `bson:"_id,omitempty"`
	UserID primitive.ObjectID `bson:"user_id,omitempty"`
	// required for sub-task experience
	ParentTaskID primitive.ObjectID `bson:"parent_task_id,omitempty"`
	// required for recurring tasks
	RecurringTaskTemplateID primitive.ObjectID `bson:"recurring_task_template_id,omitempty"`
	// generic task values (for all sources)
	IDExternal         string              `bson:"id_external,omitempty"`
	IDOrdering         int                 `bson:"id_ordering,omitempty"`
	IDTaskSection      primitive.ObjectID  `bson:"id_task_section,omitempty"`
	IsCompleted        *bool               `bson:"is_completed,omitempty"`
	IsDeleted          *bool               `bson:"is_deleted,omitempty"`
	Sender             string              `bson:"sender,omitempty"`
	SourceID           string              `bson:"source_id,omitempty"`
	SourceAccountID    string              `bson:"source_account_id,omitempty"`
	Deeplink           string              `bson:"deeplink,omitempty"`
	Title              *string             `bson:"title,omitempty"`
	Body               *string             `bson:"body,omitempty"`
	HasBeenReordered   bool                `bson:"has_been_reordered,omitempty"`
	DueDate            *primitive.DateTime `bson:"due_date,omitempty"`
	TimeAllocation     *int64              `bson:"time_allocated,omitempty"` // time in nanoseconds
	CreatedAtExternal  primitive.DateTime  `bson:"created_at_external,omitempty"`
	UpdatedAt          primitive.DateTime  `bson:"updated_at,omitempty"`
	CompletedAt        primitive.DateTime  `bson:"completed_at,omitempty"`
	SharedUntil        primitive.DateTime  `bson:"shared_until,omitempty"`
	SharedAccess       *SharedAccess       `bson:"shared_access,omitempty"`
	DeletedAt          primitive.DateTime  `bson:"deleted_at,omitempty"`
	PriorityNormalized *float64            `bson:"priority_normalized,omitempty"`
	// for new user experience
	NUXNumber int `bson:"nux_number_id,omitempty"`
	// meeting prep fields
	MeetingPreparationParams *MeetingPreparationParams `bson:"meeting_preparation_params,omitempty"`
	IsMeetingPreparationTask bool                      `bson:"is_meeting_preparation_task,omitempty"`
}

type RecurringTaskTemplate struct {
	// task fields
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID             primitive.ObjectID `bson:"user_id,omitempty" json:"user_id,omitempty"`
	Title              *string            `bson:"title,omitempty" json:"title,omitempty"`
	Body               *string            `bson:"body,omitempty" json:"body,omitempty"`
	IDTaskSection      primitive.ObjectID `bson:"id_task_section,omitempty" json:"id_task_section,omitempty"`
	PriorityNormalized *float64           `bson:"priority_normalized,omitempty" json:"priority_normalized,omitempty"`
	// recurrence fields
	IsEnabled                    *bool              `bson:"is_enabled,omitempty" json:"is_enabled,omitempty"`
	IsDeleted                    *bool              `bson:"is_deleted,omitempty" json:"is_deleted,omitempty"`
	RecurrenceRate               *int               `bson:"recurrence_rate,omitempty" json:"recurrence_rate,omitempty"` // i.e. 0 = Daily, 1 = WeekDaily, 2 = Weekly, etc.
	TimeOfDaySecondsToCreateTask *int               `bson:"time_of_day_seconds_to_create_task,omitempty" json:"time_of_day_seconds_to_create_task,omitempty"`
	DayToCreateTask              *int               `bson:"day_to_create_task,omitempty" json:"day_to_create_task,omitempty"`
	MonthToCreateTask            *int               `bson:"month_to_create_task,omitempty" json:"month_to_create_task,omitempty"`
	LastBackfillDatetime         primitive.DateTime `bson:"last_backfill_datetime,omitempty" json:"last_backfill_datetime,omitempty"`
	// existing template tasks replaced by new task
	ReplaceExisting *bool `bson:"replace_existing,omitempty" json:"replace_existing,omitempty"`
	// created at
	CreatedAt primitive.DateTime `bson:"created_at,omitempty" json:"created_at,omitempty"`
	UpdatedAt primitive.DateTime `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
}

type Calendar struct {
	AccessRole      string `bson:"access_role,omitempty"`
	CalendarID      string `bson:"calendar_id,omitempty"`
	ColorID         string `bson:"color_id,omitempty"`
	Title           string `bson:"title,omitempty"`
	ColorBackground string `bson:"color_background,omitempty"`
	ColorForeground string `bson:"color_foreground,omitempty"`
}

type CalendarAccount struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	UserID     primitive.ObjectID `bson:"user_id,omitempty"`
	IDExternal string             `bson:"id_external,omitempty"`
	Calendars  []Calendar         `bson:"calendars,omitempty"`
	Scopes     []string           `bson:"scopes,omitempty"`
	SourceID   string             `bson:"source_id,omitempty"`
}

type CalendarEvent struct {
	ID              primitive.ObjectID `bson:"_id,omitempty"`
	UserID          primitive.ObjectID `bson:"user_id,omitempty"`
	IDExternal      string             `bson:"id_external,omitempty"`
	SourceID        string             `bson:"source_id,omitempty"`
	SourceAccountID string             `bson:"source_account_id,omitempty"`
	CalendarID      string             `bson:"calendar_id,omitempty"`
	ColorID         string             `bson:"color_id,omitempty"`
	Deeplink        string             `bson:"deeplink,omitempty"`
	Title           string             `bson:"title,omitempty"`
	Body            string             `bson:"body,omitempty"`
	Location        string             `bson:"location,omitempty"`
	EventType       string             `bson:"event_type,omitempty"`
	DatetimeEnd     primitive.DateTime `bson:"datetime_end,omitempty"`
	DatetimeStart   primitive.DateTime `bson:"datetime_start,omitempty"`
	//time in nanoseconds
	TimeAllocation  int64              `bson:"time_allocated"`
	CallLogo        string             `bson:"call_logo,omitempty"`
	CallPlatform    string             `bson:"call_platform,omitempty"`
	CallURL         string             `bson:"call_url,omitempty"`
	CanModify       bool               `bson:"can_modify,omitempty"`
	LinkedTaskID    primitive.ObjectID `bson:"linked_task_id,omitempty"`
	LinkedViewID    primitive.ObjectID `bson:"linked_view_id,omitempty"`
	LinkedSourceID  string             `bson:"linked_task_source_id,omitempty"`
	ColorBackground string             `bson:"color_background,omitempty"`
	ColorForeground string             `bson:"color_foreground,omitempty"`
	AttendeeEmails  []string           `bson:"attendee_emails,omitempty"`
}

type MeetingPreparationParams struct {
	CalendarEventID               primitive.ObjectID `bson:"event_id,omitempty"`
	IDExternal                    string             `bson:"id_external,omitempty"`
	DatetimeStart                 primitive.DateTime `bson:"datetime_start,omitempty"`
	DatetimeEnd                   primitive.DateTime `bson:"datetime_end,omitempty"`
	HasBeenAutomaticallyCompleted bool               `bson:"has_been_automatically_completed,omitempty"`
	EventMovedOrDeleted           bool               `bson:"event_moved_or_deleted,omitempty"`
}

type UserSetting struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	UserID     primitive.ObjectID `bson:"user_id"`
	FieldKey   string             `bson:"field_key"`
	FieldValue string             `bson:"field_value"`
}

type WaitlistEntry struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Email     string             `bson:"email"`
	HasAccess bool               `bson:"has_access"`
	CreatedAt primitive.DateTime `bson:"created_at"`
}

type FeedbackItem struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	Feedback  string             `bson:"feedback"`
	Email     string             `bson:"email"`
	Name      string             `bson:"name"`
	CreatedAt primitive.DateTime `bson:"created_at"`
}

type LogEvent struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	EventType string             `bson:"event_type"`
	CreatedAt primitive.DateTime `bson:"created_at"`
}

type ServerRequestInfo struct {
	Timestamp     primitive.DateTime `bson:"timestamp,omitempty"`
	Method        string             `bson:"method,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id,omitempty"`
	LatencyMS     int64              `bson:"latency_ms,omitempty"`
	ObjectID      primitive.ObjectID `bson:"object_id,omitempty"` // can be task, event, section, etc.
	SourceID      string             `bson:"source_id,omitempty"`
	TimeToCloseMS int64              `bson:"time_to_close_ms,omitempty"` // only will be populated when a task is completed
	StatusCode    int                `bson:"status_code,omitempty"`
}

type TaskSection struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	IDOrdering int                `bson:"id_ordering"`
	UserID     primitive.ObjectID `bson:"user_id"`
	Name       string             `bson:"name"`
}

type Pagination struct {
	Limit *int `form:"limit" json:"limit"`
	Page  *int `form:"page" json:"page"`
}

type Recipients struct {
	To  []Recipient `bson:"to" json:"to"`
	Cc  []Recipient `bson:"cc" json:"cc"`
	Bcc []Recipient `bson:"bcc" json:"bcc"`
}

type Recipient struct {
	Name  string `bson:"name" json:"name"`
	Email string `bson:"email" json:"email"`
}

type View struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	IDOrdering    int                `bson:"id_ordering"`
	Type          string             `bson:"type"`
	IsReorderable bool               `bson:"is_reorderable"`
	IsLinked      bool               `bson:"is_linked"`
	TaskSectionID primitive.ObjectID `bson:"task_section_id"`
}

type DefaultSectionSettings struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	UserID       primitive.ObjectID `bson:"user_id"`
	NameOverride string             `bson:"name_override"`
}

type Note struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	UserID        primitive.ObjectID `bson:"user_id"`
	LinkedEventID primitive.ObjectID `bson:"linked_event_id,omitempty"`
	Title         *string            `bson:"title,omitempty"`
	Body          *string            `bson:"body,omitempty"`
	Author        string             `bson:"author,omitempty"`
	CreatedAt     primitive.DateTime `bson:"created_at,omitempty"`
	UpdatedAt     primitive.DateTime `bson:"updated_at,omitempty"`
	SharedUntil   primitive.DateTime `bson:"shared_until,omitempty"`
	SharedAccess  *SharedAccess      `bson:"shared_access,omitempty"`
	IsDeleted     *bool              `bson:"is_deleted,omitempty"`
}

