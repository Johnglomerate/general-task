import toast from 'react-hot-toast'
import { GTDialog, GTDialogBody } from '@/components/ui/gt-dialog'
import { cn } from '@/lib/utils'
import { CalendarPlus, Feather, LucideIcon, Pause, Sparkles } from 'lucide-react'
import { useGoalCreation } from './creation/shared/GoalCreationContext'
import { TGoal } from './goalTypes'
import { contractLine } from './verdict'

/**
 * The repair moment (GOALS-V1-SCOPE §Recovery): one dialog, four honest choices.
 * Framing rules — open with what's still TRUE, never with what failed; resurface
 * the user's own why verbatim. Neutral/warm styling throughout: off-track knocks,
 * it never shames.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Derive the repair opener from the visible runway. Always leads with what's still true. */
const openerLine = (goal: TGoal): string => {
    if (goal.id === 'goal-interviews') return '2 weeks left — this is still in reach.'
    return `${goal.timeframeLabel} — there’s still room to land this.`
}

/** "In May you said" — the month the goal was set, read off the timeframe start. */
const startMonthPhrase = (goal: TGoal): string => {
    const first = goal.timeframeLabel.split(' ')[0]
    const month = MONTHS.find((m) => first.startsWith(m))
    return month ? `In ${month} you said` : 'When you set this you said'
}

/** Push the end date out; later planning passes can re-space milestones in more detail. */
const extendedTimeframe = (goal: TGoal): string => {
    if (goal.timeframeLabel.includes('–')) return `${goal.timeframeLabel.split('–')[0].trim()} – Sep 26`
    return 'By Oct 31'
}

interface TRepairOption {
    icon: LucideIcon
    title: string
    description: string
    toastMessage: string
    patch: (goal: TGoal) => Partial<TGoal>
}

const REPAIR_OPTIONS: TRepairOption[] = [
    {
        icon: Feather,
        title: 'Ease the plan',
        description: 'Soften the current phase; the endgame stays.',
        toastMessage: 'Plan eased — this phase is lighter now',
        patch: () => ({ status: 'on_track' }),
    },
    {
        icon: CalendarPlus,
        title: 'Extend the runway',
        description: 'Keep the shape, push the date; grace recomputes.',
        toastMessage: 'Runway extended — grace recomputed from the new date',
        patch: (goal) => ({
            status: 'on_track',
            timeframeLabel: extendedTimeframe(goal),
            contractLine: contractLine(6),
        }),
    },
    {
        icon: Sparkles,
        title: 'Fresh week',
        description: 'Forgive the misses, keep everything.',
        toastMessage: 'Fresh week — slate cleared',
        patch: (goal) => ({
            status: 'on_track',
            weekLabel: goal.weekLabel ? goal.weekLabel.replace(/^\d+/, '0') : undefined,
        }),
    },
    {
        icon: Pause,
        title: 'Pause',
        description: 'The honest exit ramp; dates shift on resume.',
        toastMessage: 'Paused — no penalty. Resume when ready.',
        patch: () => ({ status: 'paused', weekLabel: undefined }),
    },
]

const RepairDialog = () => {
    const { allGoals, repairGoalId, setRepairGoalId, applyGoalRepair } = useGoalCreation()
    const goal = allGoals.find((g) => g.id === repairGoalId)

    const choose = (option: TRepairOption) => {
        if (!goal) return
        applyGoalRepair(goal.id, option.patch(goal))
        toast.success(option.toastMessage)
        setRepairGoalId(null)
    }

    return (
        <GTDialog
            open={!!goal}
            onOpenChange={(next) => !next && setRepairGoalId(null)}
            label="Goal check-in"
            description="Choose how to get this goal back on track."
        >
            {goal && (
                <GTDialogBody className="gap-3">
                    <h2 className="text-title-md leading-snug text-foreground">{openerLine(goal)}</h2>
                    <blockquote className="border-l-2 border-border pl-3 text-body-md text-secondary-foreground">
                        {startMonthPhrase(goal)}: “{goal.why}” — still true?
                    </blockquote>
                    {goal.contractLine && <p className="text-body-sm text-muted-foreground">{goal.contractLine}</p>}

                    <div className="mt-1 flex flex-col gap-0.5" role="group" aria-label="Repair options">
                        {REPAIR_OPTIONS.map((option) => (
                            <button
                                key={option.title}
                                type="button"
                                onClick={() => choose(option)}
                                className={cn(
                                    '-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-lg px-2 py-2.5 text-left',
                                    'transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]',
                                    'focus-visible:bg-muted focus-visible:outline-none'
                                )}
                            >
                                <div className="mt-px flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    <option.icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-body-sm font-medium text-foreground">{option.title}</p>
                                    <p className="mt-0.5 text-body-sm text-muted-foreground">{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </GTDialogBody>
            )}
        </GTDialog>
    )
}

export default RepairDialog
