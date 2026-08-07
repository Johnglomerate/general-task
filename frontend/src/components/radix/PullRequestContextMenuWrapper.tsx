import { useState } from 'react'
import { TPullRequest } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import ScheduleTaskModal from '../molecules/ScheduleTaskModal'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'
import { getScheduleMenuItem } from './TaskContextMenuWrapper'

interface PullRequestContextMenuWrapperProps {
    pullRequest: TPullRequest
    children: React.ReactNode
}
/*
 * Dragging a pull request onto the calendar is its only scheduling path today, and drag never
 * fires on touch — this menu is the tap-reachable equivalent.
 */
const PullRequestContextMenuWrapper = ({ pullRequest, children }: PullRequestContextMenuWrapperProps) => {
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const items: GTMenuItem[] = [getScheduleMenuItem(() => setIsScheduleModalOpen(true))]

    return (
        <>
            <GTContextMenu items={items} trigger={children} onOpenChange={emptyFunction} />
            {isScheduleModalOpen && (
                <ScheduleTaskModal pullRequest={pullRequest} onClose={() => setIsScheduleModalOpen(false)} />
            )}
        </>
    )
}

export default PullRequestContextMenuWrapper
