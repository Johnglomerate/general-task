import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { ConsolidationCard } from './creation/mirror/ConsolidationCard'
import { MirrorQuickAdd } from './creation/mirror/MirrorQuickAdd'
import { isLabMode, useGoalCreation } from './creation/shared/GoalCreationContext'
import { GOAL_STATUS_LABEL, TGoal, TGoalStatus } from './goalTypes'

export const GoalStatusBadge = ({ status }: { status: TGoalStatus }) => (
    <Badge
        variant="outline"
        className={cn(
            'shrink-0 font-medium',
            status === 'on_track' && 'border-success/40 text-success',
            status === 'behind' && 'border-gt-gold/50 text-gt-gold',
            status === 'off_track' && 'border-destructive/40 text-destructive',
            status === 'paused' && 'border-border text-muted-foreground'
        )}
    >
        {GOAL_STATUS_LABEL[status]}
    </Badge>
)

export const GoalProgressBar = ({ progress, className }: { progress: number; className?: string }) => (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-muted', className)}>
        <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
        />
    </div>
)

interface GoalCardProps {
    goal: TGoal
    isSelected: boolean
    onClick: () => void
}
/** Card in the goals grid: title · hairline progress · status on one row, the readout beneath. */
const GoalCard = ({ goal, isSelected, onClick }: GoalCardProps) => (
    <div
        onClick={onClick}
        className={cn(
            'flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:bg-secondary/45',
            isSelected && 'border-transparent bg-secondary'
        )}
    >
        <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-title-sm text-foreground">{goal.title}</span>
            <GoalProgressBar progress={goal.progress} className="w-14 shrink-0" />
            <GoalStatusBadge status={goal.status} />
        </div>
        <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
            {goal.progressMode === 'cadence' && <Icon icon={icons.arrows_repeat} color="gray" size="small" />}
            <span className="truncate">
                {goal.progressLabel} · {goal.timeframeLabel}
                {goal.progressMode === 'cadence' && ' · weekly cadence'}
                {goal.progressMode === 'manual' && ' · self-graded'}
            </span>
        </div>
    </div>
)

interface GoalsListProps {
    selectedGoalId: string | null
    onSelect: (id: string) => void
    // The dedicated Goals page renders its own page header + actions; the
    // embedded section header is only for surfaces that lack one.
    hideSectionHeader?: boolean
}
const GoalsList = ({ selectedGoalId, onSelect, hideSectionHeader }: GoalsListProps) => {
    const { allGoals, openFlow, iteration, createdGoals, consolidationDismissed, mirrorGoalId } = useGoalCreation()

    // The Mirror's created goal is lab-only and tracked by id; its presence gates
    // the consolidation card off and the quick-add on.
    const mirrorGoal = mirrorGoalId ? createdGoals.find((g) => g.id === mirrorGoalId) : undefined
    const isMirror = isLabMode && iteration === 'mirror'
    const showConsolidation = isMirror && !mirrorGoal && !consolidationDismissed
    const showQuickAdd = isMirror && mirrorGoal != null

    return (
        <div className="mb-4">
            {!hideSectionHeader && (
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-label-md uppercase tracking-wider text-muted-foreground">Goals</span>
                    {iteration !== 'mirror' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-muted-foreground"
                            onClick={openFlow}
                        >
                            <Icon icon={icons.plus} color="gray" size="small" />
                            New goal
                        </Button>
                    )}
                </div>
            )}
            {showConsolidation && <ConsolidationCard />}
            {allGoals.length === 0 && !showConsolidation && (
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary px-4 py-6 text-center animate-in fade-in-0 duration-300">
                    <p className="text-title-sm text-foreground">No goals yet</p>
                    <p className="max-w-[320px] text-body-sm text-muted-foreground">
                        Turn something you’re aiming for into a trackable plan.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 bg-background transition-transform active:scale-[0.96]"
                        onClick={openFlow}
                    >
                        + New goal
                    </Button>
                </div>
            )}
            {/* Responsive grid; cards stretch to fill the pane so no dead space sits to their right. */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {allGoals.map((goal) => (
                    <GoalCard
                        key={goal.id}
                        goal={goal}
                        isSelected={goal.id === selectedGoalId}
                        onClick={() => onSelect(goal.id)}
                    />
                ))}
            </div>
            {showQuickAdd && mirrorGoal && <MirrorQuickAdd goalId={mirrorGoal.id} />}
        </div>
    )
}

export default GoalsList
