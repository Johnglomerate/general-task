import { useCallback } from 'react'
import { renderToString } from 'react-dom/server'
import { DateTime } from 'luxon'
import showdown from 'showdown'
import { v4 as uuidv4 } from 'uuid'
import { useSetting } from '../../../hooks'
import { useCreateEvent, useGetCalendars } from '../../../services/api/events.hooks'
import { TOverviewView, TPullRequest, TTaskV4 } from '../../../utils/types'
import adf2md from '../../atoms/GTTextField/AtlassianEditor/adfToMd'
import { NuxTaskBodyStatic } from '../../details/NUXTaskBody'
import useConnectGoogleAccountToast from './useConnectGoogleAccountToast'

export const DEFAULT_EVENT_DURATION_IN_MINUTES = 30

// Google Calendar renders the description as HTML, so bodies are converted before sending. The
// trailing anchor is how we mark events General Task created.
const getEventDescription = (body: string, task?: TTaskV4) => {
    if (task?.id_nux_number) {
        return renderToString(<NuxTaskBodyStatic nux_number_id={task.id_nux_number} renderSettingsModal={false} />)
    }
    let description = body
    // convert ADF to markdown (if originally ADF)
    if (task?.source.name === 'Jira' && description !== '') {
        description = adf2md.convert(JSON.parse(description)).result
    }
    // then convert markdown to HTML
    description = new showdown.Converter().makeHtml(description)
    if (description !== '') {
        description += '\n'
    }
    description = description.replaceAll('\n', '<br>')
    return `${description}<a href="https://generaltask.com/" __is_owner="true">created by General Task</a>`
}

interface ScheduleOnCalendarArgs {
    start: DateTime
    durationInMinutes?: number
    task?: TTaskV4
    pullRequest?: TPullRequest
    view?: TOverviewView
    // the calendar day whose event cache should be updated — defaults to the day of `start`
    date?: DateTime
}

/*
 * The single path for turning a task, pull request, or list header into a calendar event.
 * Dragging onto the calendar and the explicit "Schedule" action both call this, so the two
 * cannot drift apart. Returns false when there is no calendar to schedule onto (a toast
 * prompting the user to connect Google has already been shown in that case).
 */
const useScheduleTask = () => {
    const { mutate: createEvent } = useCreateEvent()
    const { data: calendars } = useGetCalendars()
    const { field_value: taskToCalAccount } = useSetting('calendar_account_id_for_new_tasks')
    const { field_value: taskToCalCalendar } = useSetting('calendar_calendar_id_for_new_tasks')
    const showConnectToast = useConnectGoogleAccountToast()

    const scheduleOnCalendar = useCallback(
        ({
            start,
            durationInMinutes = DEFAULT_EVENT_DURATION_IN_MINUTES,
            task,
            pullRequest,
            view,
            date,
        }: ScheduleOnCalendarArgs) => {
            if (!calendars?.length) {
                showConnectToast()
                return false
            }
            const end = start.plus({ minutes: durationInMinutes })
            const droppableItem = task ?? pullRequest
            if (droppableItem) {
                createEvent({
                    createEventPayload: {
                        account_id: taskToCalAccount,
                        calendar_id: taskToCalCalendar,
                        datetime_start: start.toISO(),
                        datetime_end: end.toISO(),
                        summary: droppableItem.title,
                        description: getEventDescription(droppableItem.body, task),
                        task_id: task?.id ?? '',
                        pr_id: pullRequest?.id ?? '',
                    },
                    date: date ?? start,
                    linkedTask: task,
                    linkedPullRequest: pullRequest,
                    optimisticId: uuidv4(),
                })
                return true
            }
            if (view) {
                createEvent({
                    createEventPayload: {
                        summary: view.name,
                        account_id: taskToCalAccount,
                        calendar_id: taskToCalCalendar,
                        datetime_start: start.toISO(),
                        datetime_end: end.toISO(),
                        view_id: view.id,
                    },
                    date: date ?? start,
                    linkedView: view,
                    optimisticId: uuidv4(),
                })
                return true
            }
            return false
        },
        [calendars, taskToCalAccount, taskToCalCalendar]
    )

    return { scheduleOnCalendar, hasCalendars: !!calendars?.length }
}

export default useScheduleTask
