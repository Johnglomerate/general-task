import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { usePreviewMode, useToast } from '../../hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TPullRequest, TTaskV4 } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTTimeInput, { TIME_INPUT_FORMAT, parseTimeInput } from '../atoms/GTTimeInput'
import GTButton from '../atoms/buttons/GTButton'
import { BodySmall, LabelSmall } from '../atoms/typography/Typography'
import { EVENT_CREATION_INTERVAL_IN_MINUTES } from '../calendar/CalendarEvents-styles'
import useScheduleTask, { DEFAULT_EVENT_DURATION_IN_MINUTES } from '../calendar/utils/useScheduleTask'
import GTModal from '../mantine/GTModal'
import GTSelect from '../radix/GTSelect'
import GTDatePicker from './GTDatePicker'
import { toast } from './toast'

const DURATION_OPTIONS = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1 hour 30 minutes' },
    { value: '120', label: '2 hours' },
]

const Body = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._16};
`
const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
`

// the next slot on the calendar grid, so the default start matches what dragging would produce
const getNextInterval = () => {
    const now = DateTime.local().set({ second: 0, millisecond: 0 })
    const remainder = now.minute % EVENT_CREATION_INTERVAL_IN_MINUTES
    return remainder === 0 ? now : now.plus({ minutes: EVENT_CREATION_INTERVAL_IN_MINUTES - remainder })
}

interface ScheduleTaskModalProps {
    task?: TTaskV4
    pullRequest?: TPullRequest
    onClose: () => void
}
/*
 * Schedules a task or pull request onto the calendar without dragging. Drag-to-schedule is the
 * only other path and it never fires on touch, so this is the only way in on a phone.
 */
const ScheduleTaskModal = ({ task, pullRequest, onClose }: ScheduleTaskModalProps) => {
    const { scheduleOnCalendar } = useScheduleTask()
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()

    const [start, setStart] = useState(getNextInterval)
    const [startInput, setStartInput] = useState(() => start.toFormat(TIME_INPUT_FORMAT))
    const [durationInMinutes, setDurationInMinutes] = useState(String(DEFAULT_EVENT_DURATION_IN_MINUTES))

    const title = task?.title ?? pullRequest?.title ?? ''

    const onStartTimeChange = (value: string) => {
        setStartInput(value)
        const parsed = parseTimeInput(value, start)
        if (parsed) setStart(parsed)
    }

    const onDateChange = (date: string) => {
        const picked = DateTime.fromISO(date)
        if (!picked.isValid || picked.year < DateTime.local().year - 1) return
        setStart(picked.set({ hour: start.hour, minute: start.minute, second: 0, millisecond: 0 }))
    }

    const onSchedule = () => {
        const scheduled = scheduleOnCalendar({
            start,
            durationInMinutes: Number(durationInMinutes),
            task,
            pullRequest,
        })
        if (scheduled) {
            const message = `Scheduled “${title}” for ${start.toFormat("ccc LLL d 'at' h:mm a")}`
            if (isPreviewMode) {
                toast(message)
            } else {
                oldToast.show({ message })
            }
        }
        onClose()
    }

    return (
        <GTModal
            open
            setIsModalOpen={onClose}
            tabs={{
                title: 'Schedule on calendar',
                subtitle: title,
                body: (
                    <Body>
                        <Field>
                            <LabelSmall color="light">Date</LabelSmall>
                            <GTDatePicker
                                initialDate={start}
                                setDate={onDateChange}
                                onlyCalendar
                                showClearButton={false}
                            />
                        </Field>
                        <Field>
                            <LabelSmall color="light">Starts at</LabelSmall>
                            <Flex alignItems="center" gap={Spacing._8}>
                                <GTTimeInput value={startInput} onChange={onStartTimeChange} ariaLabel="Start time" />
                                <BodySmall color="light">{start.toFormat('ccc LLL d')}</BodySmall>
                            </Flex>
                        </Field>
                        <Field>
                            <LabelSmall color="light">Duration</LabelSmall>
                            <GTSelect
                                items={DURATION_OPTIONS}
                                value={durationInMinutes}
                                onChange={setDurationInMinutes}
                                useTriggerWidth
                            />
                        </Field>
                        <Flex justifyContent="end" gap={Spacing._8}>
                            <GTButton styleType="secondary" value="Cancel" onClick={onClose} />
                            <GTButton
                                styleType="primary"
                                icon={icons.calendar_star}
                                value="Schedule"
                                onClick={onSchedule}
                            />
                        </Flex>
                    </Body>
                ),
            }}
        />
    )
}

export default ScheduleTaskModal
