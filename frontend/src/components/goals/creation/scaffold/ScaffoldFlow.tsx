import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GTDialog, GTDialogBody, GTDialogFooter, GTDialogHeading, GTDialogSteps } from '@/components/ui/gt-dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowRight, CalendarRange, Gauge, Sparkles } from 'lucide-react'
import { draftGoalPlan as requestGoalDraftPlan } from '../../../../services/api/goals.hooks'
import { useGoalCreation } from '../shared/GoalCreationContext'
import PropertyPill, { CAPACITY_OPTIONS, TIMEFRAME_OPTIONS } from '../shared/PropertyPill'
import ReviewScreen from '../shared/ReviewScreen'
import { TGoalDraft, TGoalDraftPlan } from '../shared/scenario'

type TStep = 1 | 2 | 3 | 4

const DEFAULT_TIMEFRAME_LABEL = 'This quarter'
const DEFAULT_CAPACITY_LABEL = '~4 hrs / week'

const draftGoalPlan = async (draft: TGoalDraft): Promise<TGoalDraftPlan | null> => {
    try {
        return await requestGoalDraftPlan(draft)
    } catch (_err) {
        return null
    }
}

const buildScaffoldReviewDraft = (draft: TGoalDraft, plan: TGoalDraftPlan | null): TGoalDraft => ({
    ...draft,
    items: plan?.items ?? [],
    phases: plan?.phases,
    goalType: plan?.type,
})

const StepHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div
        style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
    >
        <GTDialogHeading title={title} subtitle={subtitle} />
    </div>
)

/**
 * Iteration 2 - The Scaffold. A four-step guided stepper (Outcome -> Why ->
 * Timeframe & capacity -> Plan) that lands on the same manual ReviewScreen used
 * for editing drafts. Step 4 asks the backend for a goal-specific draft and
 * falls back to a blank manual plan when drafting is unavailable.
 */
const ScaffoldFlow = () => {
    const { isOnboarding, closeFlow, createGoal } = useGoalCreation()

    const [render, setRender] = useState<TStep>(1)
    const [exiting, setExiting] = useState(false)
    const [isDrafting, setIsDrafting] = useState(false)
    const busyRef = useRef(false)

    const [outcome, setOutcome] = useState('')
    const [why, setWhy] = useState('')
    const [timeframeLabel, setTimeframeLabel] = useState(DEFAULT_TIMEFRAME_LABEL)
    const [capacityLabel, setCapacityLabel] = useState(DEFAULT_CAPACITY_LABEL)
    const [draftedPlan, setDraftedPlan] = useState<TGoalDraftPlan | null>(null)
    const openPopovers = useRef(0)

    const inputRef = useRef<HTMLInputElement>(null)
    const whyRef = useRef<HTMLTextAreaElement>(null)

    const reviewDraft = useCallback(
        (): TGoalDraft =>
            buildScaffoldReviewDraft({ title: outcome, why, timeframeLabel, capacityLabel, items: [] }, draftedPlan),
        [capacityLabel, draftedPlan, outcome, timeframeLabel, why]
    )

    const goTo = useCallback(
        (next: TStep) => {
            if (next < 1 || next > 4 || next === render || busyRef.current) return
            busyRef.current = true
            setExiting(true)
            window.setTimeout(() => {
                setRender(next)
                setExiting(false)
                busyRef.current = false
            }, 150)
        },
        [render]
    )

    const advance = useCallback(() => {
        if (render === 3) setIsDrafting(true)
        if (render < 4) goTo((render + 1) as TStep)
    }, [render, goTo])

    const back = useCallback(() => {
        if (render > 1) goTo((render - 1) as TStep)
    }, [render, goTo])

    useEffect(() => {
        if (render !== 4) {
            setDraftedPlan(null)
            setIsDrafting(false)
            return
        }
        let active = true
        setIsDrafting(true)
        draftGoalPlan({ title: outcome, why, timeframeLabel, capacityLabel, items: [] }).then((plan) => {
            if (!active) return
            setDraftedPlan(plan)
            setIsDrafting(false)
        })
        return () => {
            active = false
        }
    }, [capacityLabel, outcome, render, timeframeLabel, why])

    // Focus the step's primary field once it has settled in.
    useEffect(() => {
        const t = window.setTimeout(() => {
            if (render === 1) inputRef.current?.focus()
            else if (render === 2) whyRef.current?.focus()
        }, 180)
        return () => window.clearTimeout(t)
    }, [render])

    // Enter advances (steps 1-3). Guard: never past step 4, never while a popover
    // is choosing. preventDefault so a focused textarea will not also insert a newline.
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Enter' || e.shiftKey || e.metaKey || e.ctrlKey) return
            if (render >= 4 || openPopovers.current > 0) return
            e.preventDefault()
            advance()
        }
        // Capture phase: GTDialog stops bubbling at the React root, so a bubbling listener would never fire.
        window.addEventListener('keydown', onKey, true)
        return () => window.removeEventListener('keydown', onKey, true)
    }, [render, advance])

    const trackPopover = (open: boolean) => {
        openPopovers.current = Math.max(0, openPopovers.current + (open ? 1 : -1))
    }

    const renderStep = () => {
        if (render === 4) {
            const draft = reviewDraft()
            if (isDrafting) {
                return (
                    <>
                        <GTDialogBody className="gap-5">
                            <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                                <Sparkles className="size-4 shrink-0 text-primary" />
                                <span>Drafting plan...</span>
                            </div>
                        </GTDialogBody>
                        <GTDialogFooter
                            start={
                                <Button variant="ghost" size="sm" onClick={back} className="text-muted-foreground">
                                    Back
                                </Button>
                            }
                        />
                    </>
                )
            }
            return (
                <ReviewScreen
                    key={draft.items.length > 0 ? 'drafted' : 'manual'}
                    draft={draft}
                    showTypePicker={!draft.goalType}
                    provenanceNote={draft.items.length > 0 ? `Drafted from your goal · ${capacityLabel}` : undefined}
                    onConfirm={createGoal}
                    onBack={back}
                    layout="dialog"
                />
            )
        }

        return (
            <>
                <GTDialogBody className="gap-6">
                    {render === 1 && (
                        <div className="space-y-4">
                            <StepHeading title="What's the outcome?" subtitle="Name the result you're aiming for." />
                            <div
                                style={{ animationDelay: '80ms', animationFillMode: 'both' }}
                                className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                            >
                                <Input
                                    ref={inputRef}
                                    value={outcome}
                                    onChange={(e) => setOutcome(e.target.value)}
                                    placeholder="What are you aiming for?"
                                    aria-label="Goal outcome"
                                    className="h-11 rounded-lg text-body-md"
                                />
                            </div>
                        </div>
                    )}

                    {render === 2 && (
                        <div className="space-y-4">
                            <StepHeading
                                title="Why does this matter?"
                                subtitle="The reason you'll come back to when the week gets loud."
                            />
                            <div
                                style={{ animationDelay: '80ms', animationFillMode: 'both' }}
                                className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                            >
                                <textarea
                                    ref={whyRef}
                                    value={why}
                                    onChange={(e) => setWhy(e.target.value)}
                                    rows={3}
                                    placeholder="Why this matters"
                                    aria-label="Why this goal matters"
                                    className="flex w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-body-md leading-relaxed transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                <p className="text-body-sm text-muted-foreground">
                                    One honest sentence beats a paragraph.
                                </p>
                            </div>
                        </div>
                    )}

                    {render === 3 && (
                        <div className="space-y-4">
                            <StepHeading
                                title="Timeframe & capacity"
                                subtitle="How long you've got, and the pace you can actually keep."
                            />
                            <div
                                style={{ animationDelay: '80ms', animationFillMode: 'both' }}
                                className="flex flex-wrap items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                            >
                                <PropertyPill
                                    icon={<CalendarRange className="size-3.5" />}
                                    value={timeframeLabel}
                                    options={TIMEFRAME_OPTIONS}
                                    onSelect={setTimeframeLabel}
                                    onOpenChange={trackPopover}
                                />
                                <PropertyPill
                                    icon={<Gauge className="size-3.5" />}
                                    value={capacityLabel}
                                    options={CAPACITY_OPTIONS}
                                    onSelect={setCapacityLabel}
                                    onOpenChange={trackPopover}
                                />
                            </div>
                        </div>
                    )}
                </GTDialogBody>
                <GTDialogFooter
                    start={
                        render > 1 && (
                            <Button variant="ghost" size="sm" onClick={back} className="text-muted-foreground">
                                Back
                            </Button>
                        )
                    }
                    onConfirm={advance}
                    confirmLabel={
                        <>
                            Continue
                            <ArrowRight className="size-4" />
                        </>
                    }
                />
            </>
        )
    }

    const steps = <GTDialogSteps step={render} total={4} />
    const content = (
        <div
            key={render}
            className={cn(
                'flex min-h-0 flex-col gap-6 transition-[opacity,transform] duration-150 ease-out',
                exiting ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
            )}
        >
            {renderStep()}
        </div>
    )

    if (isOnboarding) {
        return (
            <div className="flex flex-col gap-6 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-label-md text-muted-foreground">New goal</span>
                    {steps}
                </div>
                {content}
            </div>
        )
    }

    return (
        <GTDialog open onOpenChange={(next) => !next && closeFlow()} label="New goal" meta={steps} size="wide">
            {content}
        </GTDialog>
    )
}

export default ScaffoldFlow
export { ScaffoldFlow, buildScaffoldReviewDraft, draftGoalPlan }
