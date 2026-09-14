import { useState } from 'react'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import { useOptionalGoalCreation } from '../goals/creation/shared/GoalCreationContext'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

interface GoalSelectorProps {
    value?: string | null
    onChange: (goalId: string | null) => void
    disabled?: boolean
}

/**
 * The "Goal" property: a task belongs to at most one goal (Linear's issue → project model).
 * Unset it is a bare target icon like the other property buttons; set, it reads the goal title.
 */
const GoalSelector = ({ value, onChange, disabled }: GoalSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const goals = useOptionalGoalCreation()
    if (!goals) return null
    const active = goals.allGoals.filter((g) => g.status !== 'paused')
    const selected = goals.allGoals.find((g) => g.id === value)

    const items: GTMenuItem[][] = [
        active.map((g) => ({
            label: g.title,
            icon: icons.check_circle_wavy,
            selected: g.id === value,
            onClick: () => onChange(g.id),
        })),
        [
            {
                label: 'No goal',
                icon: icons.x,
                selected: !value,
                onClick: () => onChange(null),
            },
        ],
    ]

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            menuInModal
            disabled={disabled}
            items={items}
            trigger={
                selected ? (
                    <GTButton
                        styleType="control"
                        icon={icons.check_circle_wavy}
                        value={selected.title}
                        tooltipText="Goal"
                    />
                ) : (
                    <GTButton styleType="icon" icon={icons.check_circle_wavy} tooltipText="Goal" />
                )
            }
        />
    )
}

export default GoalSelector
