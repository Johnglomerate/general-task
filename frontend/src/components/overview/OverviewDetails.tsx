import { useParams } from 'react-router-dom'
import { useGetMeetingPreparationTasks } from '../../services/api/meeting-preparation-tasks.hooks'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'
import useOverviewLists from './useOverviewLists'

export const useOverviewDetailState = () => {
    const { lists, isLoading, flattenedLists } = useOverviewLists()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const selectedList = lists?.find((list) => list.id === overviewViewId)
    const { data: repositories, isLoading: isGetPullRequestLoading } = useGetPullRequests()
    const { data: allTasks, isLoading: isGetAllTasksLoading } = useGetTasksV4()
    const { data: meetingPreparationTasks, isLoading: isMeetingPreparationTasksLoading } =
        useGetMeetingPreparationTasks()
    const selectedTaskId = subtaskId || overviewItemId
    const selectedPullRequest =
        selectedList?.type === 'github'
            ? repositories?.flatMap((repo) => repo.pull_requests).find((item) => item.id === overviewItemId)
            : undefined
    const selectedTask =
        selectedList?.type === 'meeting_preparation'
            ? meetingPreparationTasks?.find((task) => task.id === selectedTaskId)
            : selectedList && selectedList.type !== 'github'
            ? allTasks?.find((task) => task.id === selectedTaskId)
            : undefined

    return {
        lists,
        flattenedLists,
        selectedList,
        selectedPullRequest,
        selectedTask,
        hasSelectedOverviewDetail: Boolean(selectedPullRequest || selectedTask),
        isLoading: isLoading || isGetPullRequestLoading || isGetAllTasksLoading || isMeetingPreparationTasksLoading,
    }
}

const OverviewDetails = () => {
    const { lists, isLoading, flattenedLists, selectedList, selectedPullRequest, selectedTask } =
        useOverviewDetailState()

    if (isLoading) return null
    else if (lists.length > 0 && flattenedLists.length === 0)
        return <EmptyDetails icon={icons.check} text="Your lists are all empty" />
    else if (lists.length === 0) return <EmptyDetails icon={icons.list} text="You have no lists" />
    else if (!selectedList) {
        return null
    } else if (selectedList.type === 'github') {
        if (!selectedPullRequest) return null
        return <PullRequestDetails pullRequest={selectedPullRequest} />
    } else {
        if (!selectedTask) return null
        return <TaskDetails task={selectedTask} />
    }
}

export default OverviewDetails
