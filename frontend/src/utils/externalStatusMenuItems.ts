import { GTMenuItem } from '../components/radix/RadixUIConstants'
import { TModifyTaskData } from '../services/api/tasks.hooks'
import { externalStatusIcons } from '../styles/images'
import { TTaskV4 } from './types'

type ModifyTaskFn = (data: TModifyTaskData, optimisticId?: string) => void

/**
 * Builds the shared "external status" ladder (Linear/Jira statuses) as GTMenuItems.
 * Used by StatusDropdown, LinearTask, and the task context menu so the ladder stays
 * consistent across surfaces. Returns [] when the task has no external status data.
 * Preserves backend ordering by mapping over all_statuses as-is.
 */
export const getExternalStatusMenuItems = (task: TTaskV4, modifyTask: ModifyTaskFn): GTMenuItem[] => {
    const externalStatus = task.external_status
    const allStatuses = task.all_statuses
    if (!externalStatus || !allStatuses) return []

    return allStatuses.map((status) => ({
        label: status.state,
        icon: externalStatusIcons[status.type],
        onClick: () => modifyTask({ id: task.id, status }, task.optimisticId),
        selected: status.state === externalStatus.state,
        disabled: status.is_valid_transition === false,
        tip:
            status.is_valid_transition === false && task.source.name === 'Jira'
                ? `A workflow rule is preventing you from moving this issue to "${status.state}."`
                : undefined,
    }))
}
