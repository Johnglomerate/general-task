import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { GTDialogBody, GTDialogFooter } from '@/components/ui/gt-dialog'
import { cn } from '@/lib/utils'
import { CalendarRange, Flag, Gauge, Plus, Sparkles } from 'lucide-react'
import { TGoalType } from '../../goalTypes'
import PropertyPill, { CAPACITY_OPTIONS, TIMEFRAME_OPTIONS } from './PropertyPill'
import { TDraftPlanItem, TGoalDraft } from './scenario'

interface ReviewScreenProps {
    draft: TGoalDraft
    detectedNote?: string
    /** Optional source note shown below the goal properties. */
    provenanceNote?: string
    /** Manual fallback only: show the explicit Consistency / Time-based toggle (AI paths carry the type). */
    showTypePicker?: boolean
    onConfirm: (draft: TGoalDraft) => void
    onBack?: () => void
    /**
     * `panel` (default): self-contained scroll region + bordered footer, for CreationModal / OnboardingFrame.
     * `dialog`: renders straight into GTDialog's body + footer slots (the scaffold wizard).
     */
    layout?: 'panel' | 'dialog'
}

const TYPE_OPTIONS: { value: TGoalType; label: string }[] = [
    { value: 'consistency', label: 'Consistency' },
    { value: 'time', label: 'Time-based' },
]

/** Per-cadence frequency options — local because only the plan rows use them. */
const FREQUENCY_OPTIONS = ['1× / week', '2× / week', '3× / week', '1× / month']

const GROUPS: { label: string; addLabel: string; kind: TDraftPlanItem['kind'] }[] = [
    { label: 'Cadences', addLabel: 'Add a cadence', kind: 'cadence' },
    { label: 'One-offs', addLabel: 'Add a one-off', kind: 'oneoff' },
    { label: 'Milestones', addLabel: 'Add a milestone', kind: 'milestone' },
]

let customItemCounter = 0

const ReviewScreen = ({
    draft,
    detectedNote,
    provenanceNote,
    showTypePicker,
    onConfirm,
    onBack,
    layout = 'panel',
}: ReviewScreenProps) => {
    const [title, setTitle] = useState(draft.title)
    const [timeframeLabel, setTimeframeLabel] = useState(draft.timeframeLabel)
    const [capacityLabel, setCapacityLabel] = useState(draft.capacityLabel)
    const [goalType, setGoalType] = useState<TGoalType>(draft.goalType ?? 'consistency')
    const [items, setItems] = useState<TDraftPlanItem[]>(draft.items)
    const canConfirm = title.trim().length > 0

    const toggleItem = (id: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, included: !it.included } : it)))

    const setFrequency = (id: string, frequencyLabel: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, frequencyLabel } : it)))

    const setItemTitle = (id: string, title: string) =>
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, title } : it)))

    const addItem = (kind: TDraftPlanItem['kind']) =>
        setItems((prev) => [
            ...prev,
            {
                id: `custom-${++customItemCounter}`,
                kind,
                title: '',
                frequencyLabel: kind === 'cadence' ? '1× / week' : undefined,
                included: true,
            },
        ])

    // Keep the latest confirm payload in a ref so the ⌘Enter listener stays
    // stable. Rows left with an empty title are dropped, not created.
    const confirmRef = useRef<() => void>()
    confirmRef.current = () => {
        if (!canConfirm) return
        onConfirm({
            ...draft,
            title: title.trim(),
            timeframeLabel,
            capacityLabel,
            // Only the manual picker overrides the type — AI drafts carry it in.
            ...(showTypePicker ? { goalType } : {}),
            items: items.filter((it) => it.title.trim() !== ''),
        })
    }
    const handleConfirm = () => confirmRef.current?.()

    // ⌘Enter (or Ctrl+Enter) anywhere in the modal confirms. This listener is
    // active only while ReviewScreen is mounted — i.e. while the modal is open.
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                confirmRef.current?.()
            }
        }
        // Capture phase: GTDialog stops bubbling at the React root, so a bubbling listener would never fire.
        window.addEventListener('keydown', onKey, true)
        return () => window.removeEventListener('keydown', onKey, true)
    }, [])

    // Continuous index so row enter animations stagger across all groups.
    let rowIndex = 0

    const body = (
        <>
            {/* Title + property row */}
            <div className="space-y-2.5">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Goal title"
                    aria-label="Goal title"
                    className="w-full border-0 bg-transparent p-0 text-title-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                />
                {detectedNote && <p className="text-body-sm text-muted-foreground">{detectedNote}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <PropertyPill
                        icon={<CalendarRange className="size-3.5" />}
                        value={timeframeLabel}
                        options={TIMEFRAME_OPTIONS}
                        onSelect={setTimeframeLabel}
                    />
                    <PropertyPill
                        icon={<Gauge className="size-3.5" />}
                        value={capacityLabel}
                        options={CAPACITY_OPTIONS}
                        onSelect={setCapacityLabel}
                    />
                </div>
                {showTypePicker && (
                    <div className="flex items-center gap-2 pt-0.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
                        <span className="text-body-sm text-muted-foreground">Goal type</span>
                        <div className="inline-flex rounded-md border border-border p-0.5">
                            {TYPE_OPTIONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setGoalType(value)}
                                    className={cn(
                                        'rounded-[5px] px-2.5 py-1 text-body-sm transition-[background-color,color,transform] duration-150 active:scale-[0.96]',
                                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                                        goalType === value
                                            ? 'bg-muted font-medium text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {provenanceNote && (
                    <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                        <Sparkles className="size-3.5 shrink-0 text-primary" />
                        <span>{provenanceNote}</span>
                    </p>
                )}
                {draft.items.length === 0 && (
                    <p className="text-body-sm text-muted-foreground">
                        Build the plan yourself — add the steps that move this forward.
                    </p>
                )}
            </div>

            {/* Phase timeline — only when the plan ramps. Segments are
                    week-proportional; the plan below stays untouched. */}
            {draft.phases && draft.phases.length > 1 && (
                <div
                    style={{ animationDelay: '40ms', animationFillMode: 'both' }}
                    className="flex gap-1 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                >
                    {draft.phases.map((phase) => (
                        <div
                            key={phase.name}
                            style={{ flexGrow: phase.weeks }}
                            className="min-w-0 basis-0 rounded-md bg-muted px-2.5 py-1"
                        >
                            <p className="truncate text-body-sm font-medium leading-snug text-foreground">
                                {phase.name}
                            </p>
                            <p className="truncate text-body-sm leading-snug text-muted-foreground">
                                {phase.cadenceLabel}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Grouped plan items */}
            <div className="space-y-5">
                {GROUPS.map(({ label, addLabel, kind }) => {
                    const groupItems = items.filter((it) => it.kind === kind)
                    // AI drafts hide empty groups; a hand-built plan shows all
                    // three so there's somewhere to add rows.
                    if (groupItems.length === 0 && draft.items.length > 0) return null
                    const includedCount = groupItems.filter((it) => it.included).length
                    return (
                        <section key={kind} className="space-y-1.5">
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-label-md uppercase tracking-wider text-muted-foreground">
                                    {label}
                                </span>
                                <span className="text-label-md tabular-nums text-muted-foreground/60">
                                    {includedCount}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {groupItems.map((item) => {
                                    const delay = rowIndex++ * 80
                                    return (
                                        <div
                                            key={item.id}
                                            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-1 py-1.5',
                                                'animate-in fade-in-0 slide-in-from-bottom-1 duration-300',
                                                'transition-opacity duration-150',
                                                !item.included && 'opacity-50'
                                            )}
                                        >
                                            <Checkbox
                                                checked={item.included}
                                                onCheckedChange={() => toggleItem(item.id)}
                                                aria-label={item.title}
                                            />
                                            {item.kind === 'milestone' && (
                                                <Flag className="size-4 shrink-0 text-gt-gold" />
                                            )}
                                            <input
                                                value={item.title}
                                                onChange={(e) => setItemTitle(item.id, e.target.value)}
                                                placeholder="What needs to happen?"
                                                aria-label={item.title || 'New plan item'}
                                                autoFocus={item.title === ''}
                                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-body-md text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none"
                                            />
                                            {item.kind === 'cadence' && item.frequencyLabel && (
                                                <PropertyPill
                                                    icon={null}
                                                    value={item.frequencyLabel}
                                                    options={FREQUENCY_OPTIONS}
                                                    align="end"
                                                    onSelect={(freq) => setFrequency(item.id, freq)}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                                <button
                                    type="button"
                                    onClick={() => addItem(kind)}
                                    className="flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left text-body-sm text-muted-foreground/70 transition-colors duration-150 hover:text-foreground"
                                >
                                    <Plus className="size-4 shrink-0" />
                                    <span>{addLabel}</span>
                                </button>
                            </div>
                        </section>
                    )
                })}
            </div>
        </>
    )

    const backButton = onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            Back
        </Button>
    )
    const confirmLabel = (
        <>
            Create goal
            <kbd className="pointer-events-none inline-flex items-center gap-0.5 rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground/80">
                <span>⌘</span>
                <span>↵</span>
            </kbd>
        </>
    )

    if (layout === 'dialog') {
        return (
            <>
                <GTDialogBody className="gap-5">{body}</GTDialogBody>
                <GTDialogFooter
                    start={backButton}
                    onConfirm={handleConfirm}
                    confirmDisabled={!canConfirm}
                    confirmLabel={confirmLabel}
                />
            </>
        )
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">{body}</div>
            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border/70 px-5 py-3">
                <div>{backButton}</div>
                <Button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="gap-2 transition-transform active:scale-[0.96]"
                >
                    {confirmLabel}
                </Button>
            </footer>
        </div>
    )
}

export default ReviewScreen
