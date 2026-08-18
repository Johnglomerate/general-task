import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useIsMobile, useItemSelectionController } from '../../hooks'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import { doesAccountNeedRelinking, isSlackLinked } from '../../utils/utils'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { Header } from '../molecules/Header'
import SlackTask from '../molecules/SlackTask'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const BodyHeader = styled.div`
    ${Typography.body.large};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`

const SlackTasksView = () => {
    const { data: activeTasks, isLoading: areActiveTasksLoading } = useGetActiveTasks()
    const { slackTaskId } = useParams()
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const { calendarType, setCalendarType, setDate, dayViewDate } = useCalendarContext()

    const slackTasks = useMemo(() => activeTasks?.filter((task) => task.source.name === 'Slack') || [], [activeTasks])

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const isSlackIntegrationLinked = isSlackLinked(linkedAccounts || [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'Slack')

    const { task } = useMemo(() => {
        if (slackTasks.length === 0) return { task: null }
        for (const task of slackTasks) {
            if (task.id === slackTaskId) return { task }
        }
        return { task: isMobile ? null : slackTasks[0] }
    }, [activeTasks, isMobile, slackTaskId])
    const canValidateSlackRoute = !areActiveTasksLoading

    useEffect(() => {
        if (isMobile) {
            if (slackTaskId && canValidateSlackRoute && !task) {
                navigate('/slack', { replace: true })
            }
            return
        }
        if (task) navigate(`/slack/${task.id}`)
    }, [canValidateSlackRoute, isMobile, navigate, slackTaskId, task])

    const onClick = (id: string) => {
        if (calendarType === 'week' && slackTaskId === id) {
            setCalendarType('day')
            setDate(dayViewDate)
        }
        navigate(`/slack/${id}`)
        Log(`slack_task_select__/slack/${id}`)
    }

    const selectTask = useCallback((task: TTaskV4) => {
        navigate(`/slack/${task.id}`)
        Log(`slack_task_select__/slack/${task.id}`)
    }, [])
    useItemSelectionController(slackTasks, selectTask)

    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <Header folderName="Slack Messages" />
                    {doesNeedRelinking && <ConnectIntegration type="slack" reconnect />}
                    {isSlackIntegrationLinked ? (
                        <>
                            <BodyHeader>All messages you&apos;ve created tasks for</BodyHeader>
                            {slackTasks?.map((task) => (
                                <SlackTask
                                    key={task.id}
                                    task={task}
                                    isSelected={task.id === slackTaskId}
                                    onClick={onClick}
                                />
                            ))}
                        </>
                    ) : (
                        <ConnectIntegration type="slack" />
                    )}
                </ScrollableListTemplate>
            </Flex>
            {calendarType === 'day' && (!isMobile || slackTaskId) && (
                <>
                    {task ? (
                        <TaskDetails task={task} />
                    ) : isMobile && slackTaskId && (!canValidateSlackRoute || !task) ? (
                        <Spinner />
                    ) : (
                        <EmptyDetails icon={icons.check} text="You have no Slack tasks" />
                    )}
                </>
            )}
        </>
    )
}

export default SlackTasksView
