import { TIconImage, TLogoImage } from '../styles/images'
import { RecurrenceRate } from './enums'

export type EmptyString = ''

export type TTaskSourceName = 'General Task' | 'Google Calendar'

export type TTaskSharedAccess = 'public' | 'domain'

export type TNoteSharedAccess = 'public' | 'domain' | 'meeting_attendees'

export interface TTaskSource {
    name: TTaskSourceName
    logo: string
    logo_v2: TLogoImage
    is_completable: boolean
    is_replyable: boolean
}
export interface TTaskSourceV4 {
    name: TTaskSourceName
    logo: TLogoImage
}
export interface TConferenceCall {
    platform: string
    logo: TLogoImage | EmptyString
    url: string
}

export interface TSourcesResult {
    name: string
    authorization_url: string
}

export interface TTask {
    id: string
    optimisticId?: string
    id_ordering: number
    title: string
    deeplink: string
    body: string
    sent_at: string
    priority_normalized: number
    time_allocated: number
    due_date: string
    source: TTaskSource
    sender: string
    is_done: boolean
    is_deleted: boolean
    is_meeting_preparation_task: boolean
    isSubtask?: boolean
    meeting_preparation_params?: TMeetingPreparationParams
    nux_number_id: number
    sub_tasks?: TTask[]
    created_at: string
    updated_at: string
    parent_task_id?: string
    recurring_task_template_id?: string
}
export interface TTaskV4 {
    id: string
    optimisticId?: string // Used only internally, not sent in response
    id_ordering: number
    title: string
    deeplink: string
    body: string
    priority_normalized: number
    due_date: string
    source: TTaskSourceV4
    sender: string
    is_done: boolean
    is_deleted: boolean
    created_at: string
    updated_at: string
    deleted_at: string
    completed_at: string
    id_folder?: string
    id_nux_number?: number
    id_parent?: string
    subtask_ids?: string[]
    meeting_preparation_params?: TMeetingPreparationParams
    recurring_task_template_id?: string
    shared_until?: string
    shared_access?: TTaskSharedAccess
}

export interface TMeetingPreparationParams {
    datetime_start: string
    datetime_end: string
    event_moved_or_deleted: boolean
}

export interface TEvent {
    id: string
    optimisticId?: string
    title: string
    body: string
    account_id: string
    calendar_id: string
    color_id: string
    color_background?: string
    color_foreground?: string
    logo: TLogoImage
    deeplink: string
    datetime_start: string
    datetime_end: string
    can_modify: boolean
    conference_call: TConferenceCall
    linked_task_id: string
    linked_view_id: string
    linked_note_id?: string
}

export interface TMeetingBanner {
    title: string
    subtitle: string
    events: TMeetingEvent[]
    actions: TMeetingAction[]
}

export interface TMeetingEvent {
    title: string
    conference_call: TConferenceCall
}

export interface TMeetingAction {
    logo: string
    title: string
    link: string
}

export interface TTaskSection {
    id: string
    optimisticId?: string
    name: string
    tasks: TTask[]
    is_done: boolean
    is_trash: boolean
}
export interface TTaskFolder {
    id: string
    name: string
    task_ids: string[]
    is_done: boolean
    is_trash: boolean
    optimisticId?: string
}

export interface TSettingChoice {
    choice_key: string
    choice_name: string
}

export interface TSetting {
    field_key: string
    field_value: string
    field_name: string
    choices: TSettingChoice[]
}

export interface TSupportedType {
    name: string
    logo: string
    logo_v2: TLogoImage
    authorization_url: string
}
export interface TLinkedAccount {
    id: string
    display_id: string
    name: string
    logo: string
    logo_v2: TLogoImage
    is_unlinkable: boolean
    has_bad_token: boolean
}

export interface TUserInfo {
    agreed_to_terms: boolean
    opted_into_marketing: boolean
    name: string
    is_employee: boolean
    email: string
    is_company_email: boolean
    subscription_status?: string
    is_subscribed?: boolean
    is_in_trial?: boolean
    trial_days_remaining?: number
    has_product_access?: boolean
}

// React-DND Item Types
export enum DropType {
    TASK = 'task',
    SUBTASK = 'subtask',
    NON_REORDERABLE_TASK = 'non-reorderable-task',
    DUE_TASK = 'due-task',
    WEEK_TASK_TO_CALENDAR_TASK = 'week-task-to-calendar-task',
    EVENT = 'event',
    EVENT_RESIZE_HANDLE = 'event-resize-handle',
    OVERVIEW_VIEW = 'overview-view',
    FOLDER = 'folder',
    OVERVIEW_VIEW_HEADER = 'overview-view-header',
}

export interface DropItem {
    id: string
    sectionId?: string
    task?: TTaskV4
    event?: TEvent
    folder?: TTaskSection
    view?: TOverviewView
}

export interface TTaskCreateParams {
    account_id?: string
    title: string
    body?: string
    due_date?: string
    time_duration?: number
    id_task_section?: string
}

export type TOverviewItem = TTaskV4 & TTask // TODO: change this to more general type

export type TOverviewViewType = 'task_section' | 'meeting_preparation' | 'due_today'

export interface TOverviewView {
    id: string
    optimisticId?: string
    name: string
    type: TOverviewViewType
    task_section_id?: string
    is_reorderable: boolean
    logo: TLogoImage
    view_items: TOverviewItem[]
    view_item_ids: string[]
    total_view_items?: number // the total number of items in the view without filters applied
    sources: TSourcesResult[]
    is_linked: boolean
    has_tasks_completed_today: boolean
}

export interface TSupportedViewItem {
    view_id: string // id of view if is_linked is true
    optimisticId?: string
    name: string
    is_linked: boolean
    task_section_id: string
    logo: TLogoImage
    is_added: boolean
}

export interface TSupportedView {
    optimisticId?: string
    type: TOverviewViewType
    name: string
    logo: TLogoImage
    is_nested: boolean
    is_linked: boolean
    views: TSupportedViewItem[]
    authorization_url: string
}

export type TShortcutCategory = 'Tasks' | 'Calendar' | 'General' | 'Navigation'

export interface TShortcut {
    label: string
    key: string
    keyLabel: string
    category: TShortcutCategory
    icon?: TIconImage
    hideFromCommandPalette?: boolean
    action: () => void
}

export interface TRecurringTaskTemplate {
    id: string
    optimisticId?: string
    title: string
    body?: string
    id_task_section: string
    priority_normalized?: number
    recurrence_rate: RecurrenceRate
    time_of_day_seconds_to_create_task: number
    day_to_create_task?: number
    month_to_create_task?: number
    last_backfill_datetime: string
    created_at: string
    updated_at: string
    is_deleted: boolean
    is_enabled: boolean
}

export type TLinkedAccountName = 'Google Calendar'

export interface TNote {
    id: string
    linked_event_id?: string
    linked_event_start?: string
    linked_event_end?: string
    title: string
    body: string
    author: string
    created_at: string
    updated_at: string
    shared_until?: string
    shared_access?: TNoteSharedAccess
    is_deleted: boolean
    optimisticId?: string
}

export interface TCalendar {
    calendar_id: string
    color_id: string
    title: string
    can_write: boolean
    access_role: string
    color_background: string
    color_foreground: string
}

export interface TCalendarAccount {
    account_id: string
    calendars: TCalendar[]
    has_multical_scopes: boolean
    has_primary_calendar_scopes: boolean
}

export type TParentTask = TTaskV4 & Required<Pick<TTaskV4, 'id_folder'>>

export type TSubtask = TTaskV4 & Required<Pick<TTaskV4, 'id_parent'>>

export type SharedTaskStatus = 'complete' | 'in-progress'
