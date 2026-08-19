import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useOverviewContext from '../../context/OverviewContextProvider'
import { useIsMobile, useMobileDetailRouteFallback } from '../../hooks'
import { icons } from '../../styles/images'
import ActionsContainer from '../atoms/ActionsContainer'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import { Header } from '../molecules/Header'
import AccordionItem from '../overview/AccordionItem'
import EditModal from '../overview/EditModal'
import OverviewDetails, { useOverviewDetailState } from '../overview/OverviewDetails'
import SmartPrioritizationBanner from '../overview/SmartPrioritizationBanner'
import useOverviewLists from '../overview/useOverviewLists'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const useSelectFirstItemOnFirstLoad = (isMobile: boolean, overviewItemId?: string) => {
    const { setOpenListIds } = useOverviewContext()
    const { lists, isSuccess } = useOverviewLists()
    const isFirstSuccess = useRef(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (!isFirstSuccess.current || !isSuccess) return
        if (isMobile || overviewItemId) {
            isFirstSuccess.current = false
            return
        }
        if (lists?.length === 0) return
        const firstNonEmptyView = lists?.find((list) => list.view_item_ids.length > 0)
        if (firstNonEmptyView) {
            setOpenListIds((ids) => {
                if (!ids.includes(firstNonEmptyView.id)) {
                    return [...ids, firstNonEmptyView.id]
                }
                return ids
            })
            navigate(`/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_item_ids[0]}`, { replace: true })
        } else {
            navigate(`/overview`, { replace: true })
        }
        isFirstSuccess.current = false
    }, [isMobile, lists, isSuccess, overviewItemId])
}

const DailyOverviewView = () => {
    const [isEditListsModalOpen, setIsEditListsModalOpen] = useState(false)
    const [editListTabIndex, setEditListTabIndex] = useState(0) // 0 - add, 1 - reorder
    const isMobile = useIsMobile()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()

    const { calendarType } = useCalendarContext()
    useSelectFirstItemOnFirstLoad(isMobile, overviewItemId)
    const { expandAll, collapseAll } = useOverviewContext()

    const { lists, isLoading: isOverviewDetailLoading, hasSelectedOverviewDetail } = useOverviewDetailState()
    const selectedOverviewItemId = subtaskId || overviewItemId
    const shouldShowMobileDetailSpinner = useMobileDetailRouteFallback({
        isMobile,
        detailId: overviewViewId && overviewItemId ? selectedOverviewItemId : undefined,
        canValidate: !isOverviewDetailLoading,
        hasSelectedDetail: hasSelectedOverviewDetail,
        listPath: '/overview',
    })

    if (isOverviewDetailLoading) return <Spinner />
    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <Header folderName="Daily Overview" />
                    <ActionsContainer
                        leftActions={
                            <GTButton
                                styleType="control"
                                onClick={() => {
                                    setEditListTabIndex(1)
                                    setIsEditListsModalOpen(true)
                                }}
                                icon={icons.bolt}
                                value={
                                    <span>
                                        Smart Prioritize<sup>AI</sup>
                                    </span>
                                }
                            />
                        }
                        rightActions={
                            <>
                                <GTButton
                                    styleType="control"
                                    onClick={collapseAll}
                                    icon={icons.squareMinus}
                                    value="Collapse all"
                                />
                                <GTButton
                                    styleType="control"
                                    onClick={expandAll}
                                    icon={icons.squarePlus}
                                    value="Expand all"
                                />
                                <GTButton
                                    styleType="control"
                                    onClick={() => {
                                        setEditListTabIndex(0)
                                        setIsEditListsModalOpen(true)
                                    }}
                                    icon={icons.gear}
                                    value="Edit lists"
                                />
                            </>
                        }
                    />
                    <SmartPrioritizationBanner />
                    {lists.map((list) => (
                        <AccordionItem key={list.id} list={list} />
                    ))}
                </ScrollableListTemplate>
            </Flex>
            {calendarType === 'day' &&
                (!isMobile || overviewItemId) &&
                (shouldShowMobileDetailSpinner ? <Spinner /> : <OverviewDetails />)}
            <EditModal
                isOpen={isEditListsModalOpen}
                setisOpen={setIsEditListsModalOpen}
                defaultTabIndex={editListTabIndex}
            />
        </>
    )
}

export default DailyOverviewView
