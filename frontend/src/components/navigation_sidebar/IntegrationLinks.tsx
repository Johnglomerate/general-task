import { useLocation } from 'react-router-dom'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import Skeleton from '../atoms/Skeleton'
import Tip from '../radix/Tip'
import NavigationLink from './NavigationLink'

interface IntegrationLinksProps {
    isCollapsed?: boolean
}
const IntegrationLinks = ({ isCollapsed }: IntegrationLinksProps) => {
    const { isLoading: isUserInfoLoading } = useGetUserInfo()

    const { pathname } = useLocation()

    return (
        <>
            <Flex gap={isCollapsed ? Spacing._8 : undefined} column>
                {isUserInfoLoading ? (
                    <Skeleton count={4} />
                ) : (
                    <>
                        <Tip shortcutName="goToOverviewPage" side="right">
                            <NavigationLink
                                link="/overview"
                                title="Daily Overview"
                                icon={icons.houseDay}
                                isCurrentPage={pathname.split('/')[1] === 'overview'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                        <Tip shortcutName="goToRecurringTasksPage" side="right">
                            <NavigationLink
                                link="/recurring-tasks"
                                title="Recurring tasks"
                                icon={icons.arrows_repeat}
                                isCurrentPage={pathname.split('/')[1] === 'recurring-tasks'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                        <Tip shortcutName="goToNotesPage" side="right">
                            <NavigationLink
                                link="/notes"
                                title="Notes"
                                icon={icons.note}
                                isCurrentPage={pathname.split('/')[1] === 'notes'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                        <Tip shortcutName="enterFocusMode" side="right">
                            <NavigationLink
                                link="/focus-mode"
                                title="Enter Focus Mode"
                                icon={icons.headphones}
                                isCurrentPage={pathname.split('/')[1] === 'focus-mode'}
                                isCollapsed={isCollapsed}
                            />
                        </Tip>
                    </>
                )}
            </Flex>
        </>
    )
}

export default IntegrationLinks
