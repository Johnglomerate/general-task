// Fixture payloads for the mobile acceptance spec.
//
// These live in TypeScript rather than cypress/fixtures/*.json because several payloads embed each
// other's ids: the overview list references the task by id, and the per-folder sort settings encode
// the folder id in their `field_key`. Keeping the ids in one module is what stops those from
// drifting apart silently — a mismatch does not error, it just renders an empty list.
import { TCalendarAccount, TOverviewView, TSetting, TTaskFolder, TTaskV4, TUserInfo } from '../../src/utils/types'

export const FOLDER_ID = '5f9b3b3b3b3b3b3b3b3b3b01'
export const TASK_ID = '5f9b3b3b3b3b3b3b3b3b3b02'
export const OVERVIEW_VIEW_ID = '5f9b3b3b3b3b3b3b3b3b3b03'
export const CALENDAR_ACCOUNT_ID = 'mobile-acceptance@example.com'

export const FOLDER_NAME = 'Mobile Acceptance'
export const TASK_TITLE = 'Read the acceptance proof on a phone'

// `has_product_access` is the only field that gates rendering: AuthenticatedRoutes' SubscriptionGate
// sends the browser to LOGIN_URL without it, which would leave the SPA entirely.
export const userInfo: TUserInfo = {
    agreed_to_terms: true,
    opted_into_marketing: false,
    name: 'Mobile Acceptance',
    is_employee: false,
    email: 'mobile-acceptance@example.com',
    is_company_email: false,
    subscription_status: 'active',
    is_subscribed: true,
    is_in_trial: false,
    trial_days_remaining: 0,
    has_product_access: true,
}

// A native General Task task, so the task-detail actions menu offers the full non-external set
// (including "Schedule on calendar", which TaskActionsDropdown hides for done/deleted tasks).
export const task: TTaskV4 = {
    id: TASK_ID,
    id_ordering: 1,
    title: TASK_TITLE,
    deeplink: '',
    body: 'Seeded by the mobile acceptance spec.',
    priority_normalized: 0,
    due_date: '',
    source: { name: 'General Task', logo: 'generaltask' },
    sender: '',
    is_done: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: '',
    completed_at: '',
    id_folder: FOLDER_ID,
    subtask_ids: [],
    comments: [],
}

export const folders: TTaskFolder[] = [
    { id: FOLDER_ID, name: FOLDER_NAME, task_ids: [TASK_ID], is_done: false, is_trash: false },
    { id: '000000000000000000000004', name: 'Done', task_ids: [], is_done: true, is_trash: false },
    { id: '000000000000000000000005', name: 'Trash', task_ids: [], is_done: false, is_trash: true },
]

// `useOverviewLists` does not render `view_items` from this payload for task_section lists — it
// re-derives them by matching `view_item_ids` against the /tasks/v4/ cache. The id has to appear in
// both or the list renders empty.
export const overviewViews: TOverviewView[] = [
    {
        id: OVERVIEW_VIEW_ID,
        name: FOLDER_NAME,
        type: 'task_section',
        task_section_id: FOLDER_ID,
        is_reorderable: true,
        logo: 'generaltask',
        view_items: [],
        view_item_ids: [TASK_ID],
        sources: [],
        is_linked: true,
        has_tasks_completed_today: false,
    },
]

// `useSortAndFilterSettings` treats a missing setting as still-loading, and TaskSectionView renders
// an empty list while its settings load. Without these three keys the folder route shows no tasks
// at all — so they are load-bearing, not decoration. `_overview` mirrors them for the overview page.
const sortSettings = (groupId: string, suffix: '_main' | '_overview'): TSetting[] =>
    [
        { key: 'task_sorting_preference', value: 'manual' },
        { key: 'task_sorting_direction', value: 'ascending' },
        { key: 'task_filtering_preference', value: '' },
    ].map(({ key, value }) => ({
        field_key: `${groupId}_${key}${suffix}`,
        field_value: value,
        field_name: key,
        choices: [],
    }))

export const settings: TSetting[] = [
    ...sortSettings(FOLDER_ID, '_main'),
    ...sortSettings(FOLDER_ID, '_overview'),
    {
        field_key: 'calendar_account_id_for_new_tasks',
        field_value: CALENDAR_ACCOUNT_ID,
        field_name: 'Calendar account for new tasks',
        choices: [],
    },
]

// ScheduleTaskModal disables its submit button until the calendar list resolves, so the account has
// to carry at least one writable calendar for the modal to be in its real, usable state.
export const calendars: TCalendarAccount[] = [
    {
        account_id: CALENDAR_ACCOUNT_ID,
        has_multical_scopes: true,
        has_primary_calendar_scopes: true,
        calendars: [
            {
                calendar_id: CALENDAR_ACCOUNT_ID,
                color_id: '',
                title: 'Mobile Acceptance',
                can_write: true,
                access_role: 'owner',
                color_background: '#ffffff',
                color_foreground: '#000000',
            },
        ],
    },
]
