import { useParams } from 'react-router-dom'
import { useGetMeetingPreparationTasks } from '../../services/api/meeting-preparation-tasks.hooks'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import useOverviewLists from './useOverviewLists'

export const useOverviewDetailState = () => {
    const { lists, isLoading, flattenedLists } = useOverviewLists()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const { data: allTasks, isLoading: isGetAllTasksLoading } = useGetTasksV4()
    const { data: meetingPreparationTasks, isLoading: isMeetingPreparationTasksLoading } =
        useGetMeetingPreparationTasks()
    const selectedTaskId = subtaskId || overviewItemId
    const selectedTask =
        selectedList?.type === 'meeting_preparation'
            ? meetingPreparationTasks?.find((task) => task.id === selectedTaskId)
            : selectedList
            ? allTasks?.find((task) => task.id === selectedTaskId)
            : undefined

    return {
        lists,
        flattenedLists,
        selectedList,
        selectedTask,
        hasSelectedOverviewDetail: Boolean(selectedTask),
        isLoading: isLoading || isGetAllTasksLoading || isMeetingPreparationTasksLoading,
    }
}

const OverviewDetails = () => {
    const { lists, isLoading, flattenedLists, selectedList, selectedTask } = useOverviewDetailState()

    if (isLoading) return null
    else if (lists.length > 0 && flattenedLists.length === 0)
        return <EmptyDetails icon={icons.check} text="Your lists are all empty" />
    else if (lists.length === 0) return <EmptyDetails icon={icons.list} text="You have no lists" />
    else if (!selectedList) {
        return null
    } else if (!selectedTask) return null
    return <TaskDetails task={selectedTask} />
}

export default OverviewDetails
