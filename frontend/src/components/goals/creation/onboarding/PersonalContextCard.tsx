import { cn } from '@/lib/utils'
import { Quote, Sparkles } from 'lucide-react'
import { PERSONA_CONTEXT } from '../shared/scenario'

interface PersonalContextCardProps {
    /** Collapsed one-line quote treatment for embedding inside an active flow. */
    compact?: boolean
}

/**
 * "About you" — the prefilled personal context the assistant reads to tailor its
 * questions and plans. Read-only: the demo is on rails. The `compact` variant is a
 * single-line quote used mid-flow to *show* the assistant already knows the persona.
 */
const PersonalContextCard = ({ compact }: PersonalContextCardProps) => {
    if (compact) {
        return (
            <div className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
                <Quote className="size-3.5 shrink-0 text-muted-foreground/70" />
                <span className="shrink-0 text-label-md uppercase tracking-wider text-muted-foreground/80">
                    About you
                </span>
                <span className="h-3.5 w-px shrink-0 bg-border" />
                <p className="min-w-0 flex-1 truncate text-body-sm italic text-muted-foreground">{PERSONA_CONTEXT}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-muted-foreground/80" />
                <span className="text-label-md uppercase tracking-wider text-muted-foreground">About you</span>
            </div>
            <textarea
                readOnly
                rows={5}
                value={PERSONA_CONTEXT}
                aria-label="About you"
                style={{ boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.03)' }}
                className={cn(
                    'w-full resize-none rounded-lg border border-border bg-muted/40 p-3.5',
                    'text-body-md leading-relaxed text-foreground',
                    'transition-[border-color,box-shadow] duration-150',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
            />
            <p className="text-body-sm text-muted-foreground">
                The assistant uses this to tailor its questions and plans.
            </p>
        </div>
    )
}

export default PersonalContextCard
export { PersonalContextCard }
