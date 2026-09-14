import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GTDialog, GTDialogBody, GTDialogFooter, GTDialogHeading, GTDialogSteps } from '@/components/ui/gt-dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowRight, CalendarRange, Gauge, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { TGoalType } from '../../goalTypes'
import { useGoalCreation } from '../shared/GoalCreationContext'
import PropertyPill, { CAPACITY_OPTIONS, TIMEFRAME_OPTIONS } from '../shared/PropertyPill'
import ReviewScreen from '../shared/ReviewScreen'
import {
    REALISM_TRIGGER_CAPACITY,
    REALISM_WARNING,
    SCENARIO_DRAFT,
    SCENARIO_PATHS,
    TScenarioPath,
} from '../shared/scenario'

type TStep = 1 | 2 | 3 | 4

/** Step 1 starts with a rougher outcome; the AI chip sharpens it to the scenario title. */
const OUTCOME_PREFILL = 'Rebuild my portfolio and get more clients'
const SUGGESTED_OUTCOME = SCENARIO_DRAFT.title // 'Rebuild my portfolio and land 3 freelance clients'
const SUGGESTION_LABEL = `Sharper: "${SUGGESTED_OUTCOME}"`

/** Skeleton sweep for the step-4 drafting beat — opacity + transform, never a visibility toggle. */
const SHIMMER_KEYFRAMES = `@keyframes scaffold-shimmer {
    100% { transform: translateX(100%); }
}`

/** A short heading + supporting line shared by steps 1–3 (GTDialogHeading + the step's enter animation). */
const StepHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div
        style={{ animationDelay: '0ms', animationFillMode: 'both' }}
        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
    >
        <GTDialogHeading title={title} subtitle={subtitle} />
    </div>
)

const SkeletonBar = ({ className }: { className?: string }) => (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)}>
        <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent"
            style={{ animation: 'scaffold-shimmer 1.4s ease-in-out infinite' }}
        />
    </div>
)

/** Step 4's error state — AI unreachable. Retry re-runs the draft; manual falls back to an empty, editable plan. */
const ErrorBeat = ({ onRetry, onManual }: { onRetry: () => void; onManual: () => void }) => (
    <>
        <GTDialogBody className="items-center justify-center gap-1 py-6 text-center animate-in fade-in-0 duration-300">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <TriangleAlert className="size-5 text-destructive" />
            </div>
            <h2 className="text-title-sm text-foreground">Couldn’t draft your plan</h2>
            <p className="max-w-[320px] text-body-sm leading-relaxed text-muted-foreground">
                The AI didn’t respond. Retry, or build the plan yourself — your answers are saved and everything stays
                editable either way.
            </p>
        </GTDialogBody>
        <GTDialogFooter onCancel={onManual} cancelLabel="Build it manually" onConfirm={onRetry} confirmLabel="Retry">
            <RotateCcw className="sr-only" />
        </GTDialogFooter>
    </>
)

/** Step 4's 600ms "Drafting your plan…" beat — a skeleton that echoes ReviewScreen's shape. */
const DraftingBeat = () => (
    <>
        <style>{SHIMMER_KEYFRAMES}</style>
        <GTDialogBody className="gap-5">
            <div className="space-y-2.5">
                <SkeletonBar className="h-6 w-3/4" />
                <div className="flex gap-2 pt-0.5">
                    <SkeletonBar className="h-7 w-32" />
                    <SkeletonBar className="h-7 w-28" />
                </div>
            </div>
            <div className="space-y-2">
                <SkeletonBar className="h-3 w-20" />
                {[0, 1, 2].map((i) => (
                    <SkeletonBar key={i} className="h-8 w-full" />
                ))}
            </div>
        </GTDialogBody>
        <GTDialogFooter
            start={
                <span className="flex items-center gap-2 text-body-sm text-muted-foreground">
                    <Sparkles className="size-4 animate-pulse text-primary" />
                    Drafting your plan…
                </span>
            }
        />
    </>
)

type TRealismFix = typeof REALISM_WARNING.fixes[number]

const PATH_TYPE_LABELS: Record<TGoalType, string> = { consistency: 'Consistency', time: 'Time-based' }

/**
 * Step 4's path-choice beat — the mock decompose call returned 1–2 typed paths,
 * each shaped within stated capacity. Picking one flows its items + phases +
 * type into the review draft. The realism banner is advice, not a blocker:
 * paths stay choosable while it shows.
 */
const PathsBeat = ({
    showWarning,
    onApplyFix,
    onPick,
    onBack,
}: {
    showWarning: boolean
    onApplyFix: (fix: TRealismFix) => void
    onPick: (path: TScenarioPath) => void
    onBack: () => void
}) => (
    <>
        <GTDialogBody className="gap-4">
            <StepHeading
                title="Two ways to shape this"
                subtitle="Pick the one that fits your life — the plan stays editable either way."
            />

            {showWarning && (
                <div
                    style={{ animationDelay: '40ms', animationFillMode: 'both' }}
                    className="rounded-lg border border-gt-gold/40 bg-gt-gold/10 px-3.5 py-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                >
                    <div className="flex items-start gap-2.5">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gt-gold" />
                        <div className="min-w-0 space-y-2">
                            <p className="text-body-sm leading-relaxed text-foreground">{REALISM_WARNING.message}</p>
                            <div className="flex flex-wrap gap-2">
                                {REALISM_WARNING.fixes.map((fix) => (
                                    <button
                                        key={fix.id}
                                        type="button"
                                        onClick={() => onApplyFix(fix)}
                                        className={cn(
                                            'inline-flex h-7 items-center rounded-md border border-gt-gold/40 bg-background px-2.5 text-body-sm font-medium text-foreground',
                                            'transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]',
                                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                        )}
                                    >
                                        {fix.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {SCENARIO_PATHS.map((path, i) => (
                    <button
                        key={path.id}
                        type="button"
                        onClick={() => onPick(path)}
                        style={{ animationDelay: `${80 + i * 80}ms`, animationFillMode: 'both' }}
                        className={cn(
                            'w-full rounded-lg border border-border px-4 py-3 text-left',
                            'animate-in fade-in-0 slide-in-from-bottom-1 duration-300',
                            'transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-title-sm text-foreground">{path.label}</span>
                            <span className="rounded-full border border-border px-2 py-0.5 text-label-md uppercase tracking-wider text-muted-foreground">
                                {PATH_TYPE_LABELS[path.type]}
                            </span>
                        </div>
                        <p className="mt-0.5 text-body-sm font-medium text-secondary-foreground">{path.shapeLabel}</p>
                        <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">{path.rationale}</p>
                        <p className="mt-2 truncate text-body-sm text-muted-foreground/70">
                            {path.phases.map((p) => `${p.name} · ${p.cadenceLabel}`).join('  →  ')}
                        </p>
                    </button>
                ))}
            </div>
        </GTDialogBody>
        <GTDialogFooter
            start={
                <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
                    Back
                </Button>
            }
        />
    </>
)

/**
 * Iteration 2 — The Scaffold. A four-step guided stepper (Outcome → Why →
 * Timeframe & capacity → Plan) that lands on the same ReviewScreen the Coach
 * flow ends with. No chat surface anywhere. Lives in the standard GTDialog shell
 * (step indicator in the header's meta slot) in normal mode, or renders the same
 * body/footer inline inside `OnboardingFrame` (isOnboarding) — GoalCreationFlows supplies that frame.
 */
/** Step 4's sub-states: drafting shimmer → path choice → plan review, or → error when the AI is unreachable. */
type TDraftPhase = 'drafting' | 'error' | 'paths' | 'review'

const ScaffoldFlow = () => {
    const { isOnboarding, closeFlow, createGoal, aiOffline } = useGoalCreation()

    // Rendered step + a brief "exiting" window so the outgoing step softens out
    // before the next one crossfades in.
    const [render, setRender] = useState<TStep>(1)
    const [exiting, setExiting] = useState(false)
    const busyRef = useRef(false)

    const [outcome, setOutcome] = useState(OUTCOME_PREFILL)
    const [suggestionOpen, setSuggestionOpen] = useState(true)
    const [suggestionMounted, setSuggestionMounted] = useState(true)
    const [why, setWhy] = useState(SCENARIO_DRAFT.why)
    const [timeframeLabel, setTimeframeLabel] = useState(SCENARIO_DRAFT.timeframeLabel)
    const [capacityLabel, setCapacityLabel] = useState(SCENARIO_DRAFT.capacityLabel)
    const [phase, setPhase] = useState<TDraftPhase>('drafting')
    const [manual, setManual] = useState(false)
    const [selectedPath, setSelectedPath] = useState<TScenarioPath | null>(null)
    // "Extend to Dec 31" resolves the warning without changing capacity, so
    // dismissal is tracked explicitly rather than derived from the trigger alone.
    const [realismResolved, setRealismResolved] = useState(false)
    const draftTimer = useRef<number>()
    const aiOfflineRef = useRef(aiOffline)
    aiOfflineRef.current = aiOffline
    const openPopovers = useRef(0)

    const inputRef = useRef<HTMLInputElement>(null)
    const whyRef = useRef<HTMLTextAreaElement>(null)

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
        if (render < 4) goTo((render + 1) as TStep)
    }, [render, goTo])

    const back = useCallback(() => {
        if (render > 1) goTo((render - 1) as TStep)
    }, [render, goTo])

    // The drafting beat: shimmer, then the path choice — or the error state when
    // the AI is "offline". A failed attempt runs longer (a timeout should feel like one).
    const runDraft = useCallback(() => {
        setPhase('drafting')
        window.clearTimeout(draftTimer.current)
        const willFail = aiOfflineRef.current
        draftTimer.current = window.setTimeout(() => setPhase(willFail ? 'error' : 'paths'), willFail ? 1100 : 600)
    }, [])

    // Step 4 opens with the drafting beat; leaving it resets the sub-state.
    useEffect(() => {
        if (render !== 4) {
            window.clearTimeout(draftTimer.current)
            setPhase('drafting')
            setManual(false)
            setSelectedPath(null)
            setRealismResolved(false)
            return
        }
        runDraft()
        return () => window.clearTimeout(draftTimer.current)
    }, [render, runDraft])

    const applyRealismFix = (fix: TRealismFix) => {
        if (fix.capacityLabel !== undefined) setCapacityLabel(fix.capacityLabel)
        else if (fix.timeframeLabel !== undefined) setTimeframeLabel(fix.timeframeLabel)
        setRealismResolved(true)
    }

    // Focus the step's primary field once it has settled in.
    useEffect(() => {
        const t = window.setTimeout(() => {
            if (render === 1) inputRef.current?.focus()
            else if (render === 2) whyRef.current?.focus()
        }, 180)
        return () => window.clearTimeout(t)
    }, [render])

    // Enter advances (steps 1–3). Guard: never past step 4, never while a popover
    // is choosing. preventDefault so a focused textarea won't also insert a newline.
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

    const dismissSuggestion = useCallback(() => {
        setSuggestionOpen(false)
        window.setTimeout(() => setSuggestionMounted(false), 220)
    }, [])

    const acceptSuggestion = () => {
        setOutcome(SUGGESTED_OUTCOME)
        dismissSuggestion()
    }

    const trackPopover = (open: boolean) => {
        openPopovers.current = Math.max(0, openPopovers.current + (open ? 1 : -1))
    }

    // Esc dismisses the suggestion chip only — not the modal / onboarding frame.
    // A capture-phase native listener runs ahead of (and stops) Radix's and the
    // OnboardingFrame's own document/window Escape handlers.
    useEffect(() => {
        if (render !== 1 || !suggestionOpen) return
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape') return
            e.preventDefault()
            e.stopImmediatePropagation()
            dismissSuggestion()
        }
        document.addEventListener('keydown', onKey, true)
        return () => document.removeEventListener('keydown', onKey, true)
    }, [render, suggestionOpen, dismissSuggestion])

    const renderStep = () => {
        if (render === 4) {
            if (phase === 'drafting') return <DraftingBeat />
            if (phase === 'error')
                return (
                    <ErrorBeat
                        onRetry={runDraft}
                        onManual={() => {
                            setManual(true)
                            setPhase('review')
                        }}
                    />
                )
            if (phase === 'paths')
                return (
                    <PathsBeat
                        showWarning={capacityLabel === REALISM_TRIGGER_CAPACITY && !realismResolved}
                        onApplyFix={applyRealismFix}
                        onPick={(path) => {
                            setSelectedPath(path)
                            setPhase('review')
                        }}
                        onBack={back}
                    />
                )
            // Title reflects step 1's final value; step-3 picks flow through too.
            // The chosen path's items + phases + type shape the draft.
            // Manual fallback: same review surface, but the plan starts empty.
            const chosen = selectedPath ?? SCENARIO_PATHS[0]
            return (
                <ReviewScreen
                    draft={
                        manual
                            ? { title: outcome, why, timeframeLabel, capacityLabel, items: [] }
                            : {
                                  ...SCENARIO_DRAFT,
                                  title: outcome,
                                  why,
                                  timeframeLabel,
                                  capacityLabel,
                                  items: chosen.items,
                                  phases: chosen.phases,
                                  goalType: chosen.type,
                              }
                    }
                    showTypePicker={manual}
                    provenanceNote={manual ? undefined : `Drafted by AI from your goal · sized to ${capacityLabel}`}
                    onConfirm={createGoal}
                    // AI drafts step back to the path choice; the manual fallback (no paths beat) goes to step 3.
                    onBack={manual ? back : () => setPhase('paths')}
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
                                    aria-label="Goal outcome"
                                    className="h-11 rounded-lg text-body-md"
                                />
                                {suggestionMounted && (
                                    <button
                                        type="button"
                                        onClick={acceptSuggestion}
                                        className={cn(
                                            'inline-flex max-w-full items-center gap-2 rounded-full bg-muted py-1.5 pl-2.5 pr-3.5 text-left text-body-sm text-secondary-foreground',
                                            'origin-left transition-[opacity,transform] duration-200 ease-out hover:bg-muted/80 active:scale-[0.96]',
                                            suggestionOpen
                                                ? 'opacity-100 scale-100'
                                                : 'pointer-events-none opacity-0 scale-95'
                                        )}
                                    >
                                        <Sparkles className="size-3.5 shrink-0 text-primary" />
                                        <span className="truncate">{SUGGESTION_LABEL}</span>
                                    </button>
                                )}
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

    // Onboarding: render inline into OnboardingFrame's step 2 — same column rhythm as the dialog, no portal.
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
export { ScaffoldFlow }
