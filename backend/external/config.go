package external

import (
	"fmt"
)

const (
	TASK_SERVICE_ID_GT     = "gt"
	TASK_SERVICE_ID_GOOGLE = "google"

	TASK_SOURCE_ID_GCAL    = "gcal"
	TASK_SOURCE_ID_GT_TASK = "gt_task"
)

type Config struct {
	GoogleLoginConfig     OauthConfigWrapper
	GoogleAuthorizeConfig OauthConfigWrapper
	GoogleOverrideURLs    GoogleURLOverrides
	OpenAIOverrideURL     string
}

func GetConfig() Config {
	return Config{
		GoogleLoginConfig:     getGoogleLoginConfig(),
		GoogleAuthorizeConfig: getGoogleLinkConfig(),
	}
}

type TaskServiceResult struct {
	Service TaskService
	Details TaskServiceDetails
	Sources []TaskSourceResult
}

type TaskSourceResult struct {
	Source  TaskSource
	Details TaskSourceDetails
}

func (config Config) GetTaskServiceResult(serviceID string) (*TaskServiceResult, error) {
	nameToService := config.GetNameToService()
	result, ok := nameToService[serviceID]
	if !ok {
		return nil, fmt.Errorf("task service %s not found", serviceID)
	}
	return &result, nil
}

func (config Config) GetSourceResult(sourceID string) (*TaskSourceResult, error) {
	nameToSource := config.getNameToSource()
	result, ok := nameToSource[sourceID]
	if !ok {
		return nil, fmt.Errorf("task source %s not found", sourceID)
	}
	return &result, nil
}

func (config Config) googleService() GoogleService {
	return GoogleService{
		LoginConfig:  config.GoogleLoginConfig,
		LinkConfig:   config.GoogleAuthorizeConfig,
		OverrideURLs: config.GoogleOverrideURLs,
	}
}

func (config Config) getNameToSource() map[string]TaskSourceResult {
	return map[string]TaskSourceResult{
		TASK_SOURCE_ID_GCAL: {
			Details: TaskSourceGoogleCalendar,
			Source:  GoogleCalendarSource{Google: config.googleService()},
		},
		TASK_SOURCE_ID_GT_TASK: {
			Details: TaskSourceGeneralTask,
			Source:  GeneralTaskTaskSource{},
		},
	}
}

func (config Config) GetNameToService() map[string]TaskServiceResult {
	googleService := config.googleService()

	return map[string]TaskServiceResult{
		TASK_SERVICE_ID_GT: {
			Service: GeneralTaskService{},
			Details: TaskServiceGeneralTask,
			Sources: []TaskSourceResult{{Source: GeneralTaskTaskSource{}, Details: TaskSourceGeneralTask}},
		},
		TASK_SERVICE_ID_GOOGLE: {
			Service: googleService,
			Details: TaskServiceGoogle,
			Sources: []TaskSourceResult{
				{Source: GoogleCalendarSource{Google: googleService}, Details: TaskSourceGoogleCalendar},
			},
		},
	}
}

type AuthType string

var AuthTypeOauth2 AuthType = "oauth2"

type TaskServiceDetails struct {
	ID           string
	Name         string
	Logo         string
	LogoV2       string
	AuthType     AuthType
	IsLinkable   bool
	IsSignupable bool
}

var TaskServiceGeneralTask = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_GT,
	Name:         "General Task",
	Logo:         "/images/generaltask.svg",
	LogoV2:       "generaltask",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   false,
	IsSignupable: false,
}
var TaskServiceGoogle = TaskServiceDetails{
	ID:           TASK_SERVICE_ID_GOOGLE,
	Name:         "Google Calendar",
	Logo:         "/images/gcal.png",
	LogoV2:       "gcal",
	AuthType:     AuthTypeOauth2,
	IsLinkable:   true,
	IsSignupable: true,
}

type TaskSourceDetails struct {
	ID                     string
	Name                   string
	Logo                   string
	LogoV2                 string
	IsCompletable          bool
	CanCreateTask          bool
	IsReplyable            bool
	CanCreateCalendarEvent bool
}

var TaskSourceGeneralTask = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_GT_TASK,
	Name:                   "General Task",
	Logo:                   "/images/generaltask.svg",
	LogoV2:                 "generaltask",
	IsCompletable:          true,
	CanCreateTask:          true,
	IsReplyable:            false,
	CanCreateCalendarEvent: false,
}
var TaskSourceGoogleCalendar = TaskSourceDetails{
	ID:                     TASK_SOURCE_ID_GCAL,
	Name:                   "Google Calendar",
	Logo:                   "/images/gcal.svg",
	LogoV2:                 "gcal",
	IsCompletable:          true,
	CanCreateTask:          false,
	IsReplyable:            false,
	CanCreateCalendarEvent: true,
}
