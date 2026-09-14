import { useEffect, useState } from 'react'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import GoalDetails from '../goals/GoalDetails'
import GoalsList from '../goals/GoalsList'
import GoalCreationFlows from '../goals/creation/GoalCreationFlows'
import { useGoalCreation } from '../goals/creation/shared/GoalCreationContext'
import { Header } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const GoalsView = () => {
    const { allGoals, openFlow, iteration, pendingViewGoalId, consumePendingViewGoal } = useGoalCreation()
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
    const selectedGoal = allGoals.find((goal) => goal.id === selectedGoalId)
    const { calendarType } = useCalendarContext()

    // The create toast's "View goal" lands here (from any page) and selects that goal.
    useEffect(() => {
        if (!pendingViewGoalId) return
        setSelectedGoalId(pendingViewGoalId)
        consumePendingViewGoal()
    }, [pendingViewGoalId, consumePendingViewGoal])

    const toggleSelection = (id: string) => setSelectedGoalId((current) => (current === id ? null : id))

    return (
        <>
            <ScrollableListTemplate>
                <Header folderName="Goals" />
                {allGoals.length > 0 && iteration !== 'mirror' && (
                    <div className="mb-3 flex justify-end">
                        <GTButton styleType="icon" onClick={openFlow} icon={icons.plus} tooltipText="New goal" />
                    </div>
                )}
                <GoalsList selectedGoalId={selectedGoalId} onSelect={toggleSelection} hideSectionHeader />
            </ScrollableListTemplate>
            {/* Details column is always open; it shows an empty state until a goal is picked */}
            {calendarType === 'day' &&
                (selectedGoal ? (
                    <GoalDetails goal={selectedGoal} />
                ) : (
                    <EmptyDetails
                        icon={icons.check_circle_wavy}
                        text={allGoals.length > 0 ? 'Select a goal to see its details' : 'You have no goals yet'}
                    />
                ))}
            <GoalCreationFlows />
        </>
    )
}

export default GoalsView
