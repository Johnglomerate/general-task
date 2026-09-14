import { ReactNode, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, X } from 'lucide-react'
import { useGoalCreation } from '../shared/GoalCreationContext'
import PersonalContextCard from './PersonalContextCard'

interface OnboardingFrameProps {
    children: ReactNode
}

/** Enter delays for the staggered welcome reveal (heading → card → button). */
const STAGGER_MS = 80
/** How long the welcome takes to soften out before the flow mounts. */
const EXIT_MS = 200

/**
 * Full-viewport first-run shell. Step 1 is a centered welcome that frames the
 * intent ("what are you actually trying to accomplish?") and shows the persona
 * context; step 2 hands off to `children` — the active iteration's flow. A ghost
 * close (and Esc) lets a demo driver bail back out at any point.
 */
const OnboardingFrame = ({ children }: OnboardingFrameProps) => {
    const { closeFlow } = useGoalCreation()
    const [step, setStep] = useState<1 | 2>(1)
    const [leaving, setLeaving] = useState(false)
    const advanceTimer = useRef<ReturnType<typeof setTimeout>>()

    // Clear the pending step-2 handoff if the frame unmounts mid-transition.
    useEffect(() => () => clearTimeout(advanceTimer.current), [])

    // Esc always drops out of the flow, even on the welcome step (step 2's modal
    // has its own Esc handling — a second closeFlow() is harmless).
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') closeFlow()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [closeFlow])

    const advance = () => {
        setLeaving(true)
        advanceTimer.current = setTimeout(() => setStep(2), EXIT_MS)
    }

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-background antialiased">
            {/* Soft atmospheric glow behind the welcome — pure depth, no chrome. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                    background: 'radial-gradient(60% 45% at 50% 32%, oklch(var(--muted) / 0.6), transparent 70%)',
                }}
            />

            <button
                type="button"
                onClick={closeFlow}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
            >
                <X className="size-4" />
            </button>

            {step === 1 ? (
                <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 py-16">
                    <div
                        className={cn(
                            'w-full max-w-md transition-[opacity,transform] duration-200 ease-out',
                            leaving ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
                        )}
                    >
                        <div
                            style={{ animationDelay: '0ms', animationFillMode: 'both' }}
                            className="mb-7 text-center animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
                        >
                            <span className="text-label-md uppercase tracking-wider text-muted-foreground/70">
                                Setting up your goals
                            </span>
                            <h1 className="mt-2.5 text-balance text-title-lg leading-snug text-foreground">
                                Before your tasks: what are you actually trying to accomplish?
                            </h1>
                        </div>

                        <div
                            style={{ animationDelay: `${STAGGER_MS}ms`, animationFillMode: 'both' }}
                            className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
                        >
                            <PersonalContextCard />
                        </div>

                        <div
                            style={{ animationDelay: `${STAGGER_MS * 2}ms`, animationFillMode: 'both' }}
                            className="mt-7 animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
                        >
                            <Button onClick={advance} className="w-full gap-2 transition-transform active:scale-[0.96]">
                                Continue
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative flex flex-1 flex-col animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
                    {children}
                </div>
            )}
        </div>
    )
}

export default OnboardingFrame
export { OnboardingFrame }
