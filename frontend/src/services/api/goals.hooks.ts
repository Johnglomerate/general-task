import { useMutation, useQuery, useQueryClient } from 'react-query'
import { QueryFunctionContext } from 'react-query/types/core/types'
import { TGoal } from '../../components/goals/goalTypes'
import { TGoalDraft, TGoalDraftPlan } from '../../components/goals/creation/shared/scenario'
import apiClient from '../../utils/api'

export type TGoalTaskLinks = Record<string, string>

export const useGetGoals = () => useQuery<TGoal[], void>('goals', getGoals)

const getGoals = async ({ signal }: QueryFunctionContext) => {
    const res = await apiClient.get('/goals/', { signal })
    return res.data as TGoal[]
}

export const useGetGoalTaskLinks = () => useQuery<TGoalTaskLinks, void>('goal-task-links', getGoalTaskLinks)

const getGoalTaskLinks = async ({ signal }: QueryFunctionContext) => {
    const res = await apiClient.get('/goals/task_links/', { signal })
    return res.data as TGoalTaskLinks
}

export const draftGoalPlan = async (draft: TGoalDraft): Promise<TGoalDraftPlan | null> => {
    const res = await apiClient.post('/goals/draft/', {
        title: draft.title,
        why: draft.why,
        timeframeLabel: draft.timeframeLabel,
        capacityLabel: draft.capacityLabel,
    })
    return (res.data?.plan as TGoalDraftPlan | undefined) ?? null
}

export const useCreateGoal = () => {
    const queryClient = useQueryClient()
    return useMutation((goal: Omit<TGoal, 'id'>) => createGoal(goal), {
        onSuccess: () => queryClient.invalidateQueries('goals'),
    })
}

const createGoal = async (goal: Omit<TGoal, 'id'>) => {
    const res = await apiClient.post('/goals/', goal)
    return res.data as TGoal
}

export const useUpdateGoal = () => {
    const queryClient = useQueryClient()
    return useMutation(({ goalId, patch }: { goalId: string; patch: Partial<TGoal> }) => updateGoal(goalId, patch), {
        onSuccess: () => queryClient.invalidateQueries('goals'),
    })
}

const updateGoal = async (goalId: string, patch: Partial<TGoal>) => {
    const res = await apiClient.patch(`/goals/${goalId}/`, patch)
    return res.data as TGoal
}

export const useAddGoalRecent = () => {
    const queryClient = useQueryClient()
    return useMutation(({ goalId, title }: { goalId: string; title: string }) => addGoalRecent(goalId, title), {
        onSuccess: () => queryClient.invalidateQueries('goals'),
    })
}

const addGoalRecent = async (goalId: string, title: string) => {
    const res = await apiClient.post(`/goals/${goalId}/recent/`, { title })
    return res.data as TGoal
}

export const useLinkTaskToGoal = () => {
    const queryClient = useQueryClient()
    return useMutation<unknown, unknown, { taskId: string; goalId: string | null }, { previous?: TGoalTaskLinks }>(
        ({ taskId, goalId }: { taskId: string; goalId: string | null }) => linkTaskToGoal(taskId, goalId),
        {
            onMutate: async ({ taskId, goalId }) => {
                await queryClient.cancelQueries('goal-task-links')
                const previous = queryClient.getQueryData<TGoalTaskLinks>('goal-task-links')
                queryClient.setQueryData<TGoalTaskLinks>('goal-task-links', {
                    ...(previous ?? {}),
                    ...(goalId ? { [taskId]: goalId } : {}),
                })
                if (!goalId) {
                    queryClient.setQueryData<TGoalTaskLinks>('goal-task-links', (current) => {
                        const next = { ...(current ?? {}) }
                        delete next[taskId]
                        return next
                    })
                }
                return { previous }
            },
            onError: (_error, _variables, context) => {
                queryClient.setQueryData('goal-task-links', context?.previous)
            },
            onSettled: () => queryClient.invalidateQueries('goal-task-links'),
        }
    )
}

const linkTaskToGoal = async (taskId: string, goalId: string | null) => {
    const res = await apiClient.patch(`/goals/task_links/${taskId}/`, { goal_id: goalId })
    return res.data
}
