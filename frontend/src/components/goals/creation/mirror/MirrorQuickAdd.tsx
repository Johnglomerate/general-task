import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, Plus, Sparkles, X } from 'lucide-react'
import { MIRROR_DRAFT } from '../lab/scenarioDemo'
import { useGoalCreation } from '../shared/GoalCreationContext'

/** The scripted quick-add — a single task the Mirror will offer to route. */
const QUICK_ADD_PREFILL = 'Email Sarah about the rebrand gig'

interface MirrorQuickAddProps {
    /** The mirror-created goal to route the task into. */
    goalId: string
}

/**
 * The Mirror's second act: after the goal exists, adding a related task surfaces
 * an inline routing chip — "this looks like it belongs to your goal." Accepting
 * files it under the goal's Recent (the context fires the toast + pace update);
 * dismissing softens the chip away and leaves a plain task. One row, on rails.
 */
const MirrorQuickAdd = ({ goalId }: MirrorQuickAddProps) => {
    const { addRecentToGoal } = useGoalCreation()
    const [phase, setPhase] = useState<'input' | 'added'>('input')
    const [value, setValue] = useState(QUICK_ADD_PREFILL)
    const [confirmed, setConfirmed] = useState(false)
    const [chipVisible, setChipVisible] = useState(true)
    const settleTimer = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => () => window.clearTimeout(settleTimer.current), [])

    const handleAdd = () => {
        if (!value.trim()) return
        setPhase('added')
    }

    const handleAccept = () => {
        addRecentToGoal(goalId, value)
        setConfirmed(true)
        // Let the checkmark read for a beat, then settle the chip away.
        settleTimer.current = setTimeout(() => setChipVisible(false), 1200)
    }

    const handleDismiss = () => setChipVisible(false)

    return (
        <div className="mt-3 border-t border-border/70 pt-3">
            <span className="mb-2 block px-1 text-label-md uppercase tracking-wider text-muted-foreground">
                Quick add
            </span>

            {phase === 'input' ? (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAdd()
                                }
                            }}
                            aria-label="New task"
                            className="h-10 rounded-lg pl-9 text-body-md"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="h-10 shrink-0 rounded-lg transition-transform active:scale-[0.96]"
                    >
                        Add task
                    </Button>
                </div>
            ) : (
                <div
                    style={{ animationFillMode: 'both' }}
                    className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                >
                    {/* The committed task row */}
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                        <Checkbox aria-label={value} />
                        <span className="min-w-0 flex-1 truncate text-body-md text-foreground">{value}</span>
                    </div>

                    {/* Inline routing chip — morphs to a checkmark on accept, then settles away */}
                    <div
                        className={cn(
                            'ml-6 origin-top-left transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                            chipVisible ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
                        )}
                    >
                        <div
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg border py-1.5 pl-2.5 pr-1.5 text-body-sm',
                                'transition-colors duration-200',
                                confirmed
                                    ? 'border-success/40 bg-success/10 text-success'
                                    : 'border-border bg-muted/50 text-secondary-foreground'
                            )}
                        >
                            {/* Cross-fade Sparkles → Check (both mounted, absolute) */}
                            <span className="relative size-3.5 shrink-0">
                                <Sparkles
                                    className={cn(
                                        'absolute inset-0 size-3.5 text-primary transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                                        confirmed ? 'scale-[0.25] opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0'
                                    )}
                                />
                                <Check
                                    className={cn(
                                        'absolute inset-0 size-3.5 text-success transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
                                        confirmed ? 'scale-100 opacity-100 blur-0' : 'scale-[0.25] opacity-0 blur-[4px]'
                                    )}
                                />
                            </span>

                            <span className="truncate">
                                {confirmed ? 'Added to goal' : `Add to goal: ${MIRROR_DRAFT.title}?`}
                            </span>

                            {!confirmed && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAccept}
                                        aria-label="Add to goal"
                                        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-background hover:text-foreground active:scale-[0.96]"
                                    >
                                        <Check className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDismiss}
                                        aria-label="Keep as a plain task"
                                        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-background hover:text-foreground active:scale-[0.96]"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MirrorQuickAdd
export { MirrorQuickAdd }
