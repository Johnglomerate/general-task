import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useGoalCreation } from '../shared/GoalCreationContext'

/**
 * The Mirror's opening move: instead of the user starting goal creation, the
 * system notices a cluster of related tasks and offers to formalize them. A
 * dashed, low-chrome card that reads as a suggestion — not a committed goal —
 * sitting above the real goal list. Gating (mirror iteration, no mirror goal
 * yet, not dismissed) lives in GoalsList, its only caller.
 */
const ConsolidationCard = () => {
    const { openFlow, dismissConsolidation } = useGoalCreation()

    return (
        <div
            style={{ animationFillMode: 'both' }}
            className="mb-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Sparkles className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-balance text-title-sm text-foreground">
                        These <span className="tabular-nums">14</span> tasks look related
                    </h3>
                    <p className="mt-1.5 text-pretty text-body-sm leading-relaxed text-muted-foreground">
                        You seem to be rebuilding your portfolio — outreach emails, case studies, site work. Formalize
                        it as a goal?
                    </p>
                    <div className="mt-3.5 flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={openFlow}
                            className="gap-1.5 transition-transform active:scale-[0.96]"
                        >
                            <Sparkles className="size-3.5" />
                            Review suggestion
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={dismissConsolidation}
                            className="text-muted-foreground transition-transform active:scale-[0.96]"
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConsolidationCard
export { ConsolidationCard }
