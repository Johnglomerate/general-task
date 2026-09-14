import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowUp } from 'lucide-react'
import { SCENARIO_DRAFT } from '../lab/demoPersona'
import PersonalContextCard from '../onboarding/PersonalContextCard'
import CreationModal from '../shared/CreationModal'
import { useGoalCreation } from '../shared/GoalCreationContext'
import ReviewScreen from '../shared/ReviewScreen'
import { TChatMessage, TScriptState, useScriptPlayer } from '../shared/ScriptPlayer'
import { COACH_SCRIPT } from './coachScript'

/** The review CTA label, derived from the script's action step (no hardcoded duplicate). */
const REVIEW_LABEL =
    COACH_SCRIPT.find((step): step is Extract<typeof step, { type: 'action' }> => step.type === 'action')?.label ??
    'Review the plan'

/** Three dots that breathe via opacity + scale — never a visibility toggle. */
const DOT_KEYFRAMES = `@keyframes coach-typing-dot {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.72); }
    40% { opacity: 1; transform: scale(1); }
}`

const TypingIndicator = () => (
    <div className="flex justify-start">
        <div
            aria-label="Assistant is typing"
            role="status"
            className={cn(
                'flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3.5 py-3',
                'animate-in fade-in-0 slide-in-from-bottom-1 duration-300'
            )}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="size-1.5 rounded-full bg-muted-foreground/70"
                    style={{
                        animation: 'coach-typing-dot 1.2s ease-in-out infinite',
                        animationDelay: `${i * 160}ms`,
                    }}
                />
            ))}
        </div>
    </div>
)

const MessageBubble = ({ message }: { message: TChatMessage }) => {
    const isUser = message.role === 'user'
    return (
        <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[82%] rounded-2xl px-3.5 py-2 text-body-md leading-relaxed text-foreground',
                    'animate-in fade-in-0 slide-in-from-bottom-1 duration-300',
                    isUser ? 'rounded-br-md bg-primary/10' : 'rounded-bl-md bg-muted'
                )}
            >
                {message.text}
            </div>
        </div>
    )
}

/**
 * The chat surface — standalone so it can mount inside `CreationModal` (normal
 * mode) or directly inside `OnboardingFrame`'s step 2 (onboarding) without a
 * portal burying the frame's chrome. Fills its parent (`flex-1`).
 */
const CoachConversation = ({
    state,
    onSend,
    onAction,
    onReview,
}: {
    state: TScriptState
    onSend: () => void
    onAction: () => void
    onReview: () => void
}) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to the newest message (and while the assistant types).
    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, [state.messages.length, state.isTyping])

    // When a prefilled turn is ready, focus the input so Enter sends without a click.
    useEffect(() => {
        if (state.pendingUser != null) inputRef.current?.focus()
    }, [state.pendingUser])

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <style>{DOT_KEYFRAMES}</style>

            {/* The "it knows you" cue, pinned above the thread. */}
            <div className="shrink-0 border-b border-border/70 px-4 py-3 sm:px-5">
                <PersonalContextCard compact />
            </div>

            {/* Thread */}
            <div ref={scrollRef} className="min-h-[340px] flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {state.messages.map((message, i) => (
                    <MessageBubble key={i} message={message} />
                ))}
                {state.isTyping && <TypingIndicator />}
            </div>

            {/* Input row → swaps to the primary action once the plan is ready. */}
            <div className="shrink-0 border-t border-border/70 px-4 py-3 sm:px-5">
                {state.pendingAction ? (
                    <Button onClick={onAction} className="w-full gap-2 transition-transform active:scale-[0.96]">
                        {state.pendingAction}
                        <ArrowRight className="size-4" />
                    </Button>
                ) : state.done ? (
                    <Button onClick={onReview} className="w-full gap-2 transition-transform active:scale-[0.96]">
                        {REVIEW_LABEL}
                        <ArrowRight className="size-4" />
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            readOnly
                            value={state.pendingUser ?? ''}
                            placeholder="Waiting for the assistant…"
                            aria-label="Your reply"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && state.pendingUser != null) {
                                    e.preventDefault()
                                    onSend()
                                }
                            }}
                            className="h-10 flex-1 cursor-default rounded-lg text-body-md"
                        />
                        <Button
                            type="button"
                            size="icon"
                            onClick={onSend}
                            disabled={state.pendingUser == null}
                            aria-label="Send"
                            className="size-10 shrink-0 rounded-lg transition-transform active:scale-[0.96]"
                        >
                            <ArrowUp className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Iteration 1 — The Coach. Holds the script player + phase across the whole flow
 * (so returning from review keeps the transcript intact). Chooses its own wrapper:
 * `CreationModal` in normal mode, or bare content when it is being rendered inline
 * inside `OnboardingFrame` (isOnboarding) — GoalCreationFlows supplies that frame.
 */
const CoachFlow = () => {
    const { isOnboarding, closeFlow, createGoal } = useGoalCreation()
    const { state, send, trigger } = useScriptPlayer(COACH_SCRIPT)
    const [phase, setPhase] = useState<'chat' | 'review'>('chat')

    const handleAction = () => {
        trigger()
        setPhase('review')
    }

    const content =
        phase === 'review' ? (
            <ReviewScreen draft={SCENARIO_DRAFT} onBack={() => setPhase('chat')} onConfirm={createGoal} />
        ) : (
            <CoachConversation
                state={state}
                onSend={send}
                onAction={handleAction}
                onReview={() => setPhase('review')}
            />
        )

    // Onboarding: render inline into OnboardingFrame's step 2 — no portal over the frame.
    if (isOnboarding) return content

    return (
        <CreationModal open onClose={closeFlow} breadcrumb="New goal">
            {content}
        </CreationModal>
    )
}

export default CoachFlow
export { CoachFlow }
