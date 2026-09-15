import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'
import { TIteration, isLabMode, useGoalCreation } from './GoalCreationContext'

const ITERATIONS: { value: TIteration; label: string }[] = [
    { value: 'coach', label: 'Coach' },
    { value: 'scaffold', label: 'Scaffold' },
    { value: 'mirror', label: 'Mirror' },
]

const Separator = () => <div className="mx-1 h-5 w-px bg-border" />

/** A pill toggle with a tooltip — the shared shape for the demo switches. */
const DemoToggle = ({
    label,
    tooltip,
    active,
    onClick,
}: {
    label: string
    tooltip: string
    active: boolean
    onClick: () => void
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'rounded-full px-3.5 py-1.5 text-body-md font-medium transition-transform active:scale-[0.96]',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
            >
                {label}
            </button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
)

export const IterationSwitcher = () => {
    const {
        iteration,
        setIteration,
        isOnboarding,
        setIsOnboarding,
        freshAccount,
        setFreshAccount,
        resetDemo,
    } = useGoalCreation()

    return (
        <TooltipProvider delayDuration={200}>
            <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
                <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-gt-l">
                    {isLabMode && (
                        <>
                            {ITERATIONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setIteration(value)}
                                    className={cn(
                                        'rounded-full px-3.5 py-1.5 text-body-md font-medium transition-transform active:scale-[0.96]',
                                        iteration === value
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}

                            <Separator />
                        </>
                    )}

                    <DemoToggle
                        label="Onboarding"
                        tooltip="First-run experience"
                        active={isOnboarding}
                        onClick={() => setIsOnboarding(!isOnboarding)}
                    />
                    <DemoToggle
                        label="Empty"
                        tooltip="Simulate a fresh account with no goals"
                        active={freshAccount}
                        onClick={() => setFreshAccount(!freshAccount)}
                    />

                    <Separator />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={resetDemo}
                                aria-label="Reset demo"
                                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-transform hover:text-foreground active:scale-[0.96]"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Reset demo</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    )
}
