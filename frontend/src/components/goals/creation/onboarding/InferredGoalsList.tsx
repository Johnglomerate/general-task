import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { DETECTED_NOTE, MIRROR_DRAFT } from '../lab/scenarioDemo'
import { isLabMode, useGoalCreation } from '../shared/GoalCreationContext'
import ReviewScreen from '../shared/ReviewScreen'

interface TInferredCard {
    id: string
    title: string
    note: string
    source: string
    /** Only the portfolio card is wired; the rest are demo rails. */
    confirmable: boolean
}

/**
 * Onboarding step 2 for the Mirror. Rather than asking the user what they want,
 * the system presents what it already inferred from their tasks and connected
 * tools. Confirming the portfolio card opens the same prefilled ReviewScreen the
 * consolidation path uses — inline, still inside OnboardingFrame. The other two
 * cards are present but inert (aria-disabled Confirm) to sell the surface.
 */
const CARDS: TInferredCard[] = [
    {
        id: 'inferred-portfolio',
        title: MIRROR_DRAFT.title,
        note: DETECTED_NOTE,
        source: 'Personal · Work',
        confirmable: true,
    },
    {
        id: 'inferred-interviews',
        title: 'Talk to customers weekly',
        note: 'Detected from 9 open tasks titled “Interview: …”',
        source: 'Work',
        confirmable: false,
    },
    {
        id: 'inferred-running',
        title: 'Keep running weekly',
        note: 'Detected from a recurring pattern in Personal',
        source: 'Recurring',
        confirmable: false,
    },
]

const InferredGoalsList = () => {
    const { createGoal, setMirrorGoalId } = useGoalCreation()
    const [phase, setPhase] = useState<'list' | 'review'>('list')
    const [leaving, setLeaving] = useState<string[]>([])
    const [gone, setGone] = useState<string[]>([])
    const dismissTimers = useRef<ReturnType<typeof setTimeout>[]>([])

    useEffect(() => () => dismissTimers.current.forEach((timer) => clearTimeout(timer)), [])

    if (!isLabMode) return null

    const dismiss = (id: string) => {
        setLeaving((l) => [...l, id])
        dismissTimers.current.push(setTimeout(() => setGone((g) => [...g, id]), 200))
    }

    if (phase === 'review') {
        return (
            <ReviewScreen
                draft={MIRROR_DRAFT}
                detectedNote={DETECTED_NOTE}
                onConfirm={(draft) => setMirrorGoalId(createGoal(draft).id)}
            />
        )
    }

    let cardIndex = 0

    return (
        <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-14">
            <div className="w-full max-w-md">
                <div
                    style={{ animationDelay: '0ms', animationFillMode: 'both' }}
                    className="mb-6 text-center animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
                >
                    <div className="mb-2.5 inline-flex items-center gap-1.5 text-label-md uppercase tracking-wider text-muted-foreground/70">
                        <Sparkles className="size-3.5 text-primary" />
                        Inferred from your tasks
                    </div>
                    <h1 className="text-balance text-title-lg leading-snug text-foreground">
                        Here&rsquo;s what you seem to be working toward
                    </h1>
                </div>

                <div className="space-y-2.5">
                    {CARDS.filter((c) => !gone.includes(c.id)).map((card) => {
                        const delay = 80 + cardIndex++ * 80
                        const isLeaving = leaving.includes(card.id)
                        return (
                            <div
                                key={card.id}
                                style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
                                className={cn(
                                    'rounded-lg border border-border bg-card p-4',
                                    'animate-in fade-in-0 slide-in-from-bottom-1 duration-500',
                                    'origin-top transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                                    isLeaving && 'pointer-events-none scale-95 opacity-0'
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="min-w-0 flex-1 text-balance text-title-sm text-foreground">
                                        {card.title}
                                    </h2>
                                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-label-md uppercase tracking-wider text-muted-foreground">
                                        {card.source}
                                    </span>
                                </div>
                                <p className="mt-1.5 text-pretty text-body-sm leading-relaxed text-muted-foreground">
                                    {card.note}
                                </p>
                                <div className="mt-3.5 flex items-center gap-2">
                                    {card.confirmable ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setPhase('review')}
                                            className="gap-1.5 transition-transform active:scale-[0.96]"
                                        >
                                            <Sparkles className="size-3.5" />
                                            Confirm
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            aria-disabled
                                            tabIndex={-1}
                                            className="pointer-events-none gap-1.5 opacity-60"
                                        >
                                            <Sparkles className="size-3.5" />
                                            Confirm
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => dismiss(card.id)}
                                        className="text-muted-foreground transition-transform active:scale-[0.96]"
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default InferredGoalsList
export { InferredGoalsList }
