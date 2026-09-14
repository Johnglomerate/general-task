import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import {
    useAddGoalRecent,
    useCreateGoal,
    useGetGoalTaskLinks,
    useGetGoals,
    useLinkTaskToGoal,
    useUpdateGoal,
} from '../../../../services/api/goals.hooks'
import { TGoal } from '../../goalTypes'
import { TGoalDraft, buildGoalFromDraft } from './scenario'

export type TIteration = 'coach' | 'scaffold' | 'mirror'

/**
 * Scaffold is the converged v1 flow (sync 2026-07-09). Coach and Mirror remain
 * browsable in lab mode only: load the app with `?lab` to get the full
 * three-way iteration switcher back.
 */
export const isLabMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lab')

interface TGoalCreation {
    iteration: TIteration
    setIteration: (i: TIteration) => void
    isOnboarding: boolean
    setIsOnboarding: (b: boolean) => void
    /** Lab switch: show the empty-account path without deleting persisted goals. */
    freshAccount: boolean
    setFreshAccount: (b: boolean) => void
    /** Demo switch: simulate the AI service being unreachable — step-4 drafting fails. */
    aiOffline: boolean
    setAiOffline: (b: boolean) => void
    createdGoals: TGoal[]
    allGoals: TGoal[]
    createGoal: (draft: TGoalDraft) => TGoal
    addRecentToGoal: (goalId: string, title: string) => void
    isFlowOpen: boolean
    openFlow: () => void
    closeFlow: () => void
    consolidationDismissed: boolean
    dismissConsolidation: () => void
    mirrorGoalId: string | null
    setMirrorGoalId: (id: string | null) => void
    applyGoalRepair: (goalId: string, patch: Partial<TGoal>) => void
    /** The goal currently open in the RepairDialog — any surface can set this. */
    repairGoalId: string | null
    setRepairGoalId: (id: string | null) => void
    /**
     * Task ↔ goal links (Linear model: a task belongs to at most one goal). Keyed by task id
     * (optimistic ids included). Lives here so every surface — composer, task details, goal
     * details, list rows — reads and writes the same association.
     */
    taskGoalLinks: Record<string, string>
    linkTaskToGoal: (taskId: string, goalId: string | null) => void
    goalIdForTask: (taskId: string, optimisticId?: string) => string | undefined
    /** Set by the create toast's "View goal"; the Goals page consumes it to select that goal. */
    pendingViewGoalId: string | null
    consumePendingViewGoal: () => void
    resetDemo: () => void
}

const Ctx = createContext<TGoalCreation | null>(null)

export const useGoalCreation = () => {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useGoalCreation must be used inside GoalCreationProvider')
    return ctx
}

/** Same as useGoalCreation, but null outside the provider (e.g. focus mode) so shared rows can render anywhere. */
export const useOptionalGoalCreation = () => useContext(Ctx)

export const GoalCreationProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate()
    const goalsQuery = useGetGoals()
    const taskLinksQuery = useGetGoalTaskLinks()
    const createGoalMutation = useCreateGoal()
    const updateGoalMutation = useUpdateGoal()
    const addGoalRecentMutation = useAddGoalRecent()
    const linkTaskToGoalMutation = useLinkTaskToGoal()
    const [iteration, setIteration] = useState<TIteration>('scaffold')
    const [isOnboarding, setIsOnboarding] = useState(false)
    const [freshAccount, setFreshAccount] = useState(false)
    const [aiOffline, setAiOffline] = useState(false)
    const [createdGoalIds, setCreatedGoalIds] = useState<string[]>([])
    const [isFlowOpen, setIsFlowOpen] = useState(false)
    const [consolidationDismissed, setConsolidationDismissed] = useState(false)
    const [mirrorGoalId, setMirrorGoalId] = useState<string | null>(null)
    const [repairGoalId, setRepairGoalId] = useState<string | null>(null)
    const [pendingViewGoalId, setPendingViewGoalId] = useState<string | null>(null)
    const persistedGoals = goalsQuery.data ?? []
    const taskGoalLinks = taskLinksQuery.data ?? {}
    const createdGoals = persistedGoals.filter((goal) => createdGoalIds.includes(goal.id))

    const linkTaskToGoal = useCallback(
        (taskId: string, goalId: string | null) => {
            linkTaskToGoalMutation.mutate({ taskId, goalId })
        },
        [linkTaskToGoalMutation]
    )
    const onViewGoal = useCallback(
        (goalId: string) => {
            setPendingViewGoalId(goalId)
            navigate('/goals')
        },
        [navigate]
    )

    const applyGoalRepair = useCallback(
        (goalId: string, patch: Partial<TGoal>) => {
            updateGoalMutation.mutate({ goalId, patch })
        },
        [updateGoalMutation]
    )

    const createGoal = useCallback(
        (draft: TGoalDraft) => {
            const goal = buildGoalFromDraft(draft)
            setIsFlowOpen(false)
            createGoalMutation.mutate(goal, {
                onSuccess: (saved) => {
                    setCreatedGoalIds((ids) => [...ids, saved.id])
                    // Linear-style two-line confirmation: check + "Goal created" + goal title.
                    toast.custom(
                        (t) => (
                            <div
                                style={{ boxShadow: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.12)' }}
                                className={cn(
                                    'pointer-events-auto flex w-[336px] items-start gap-3 rounded-xl border border-border bg-card p-3.5',
                                    'transition-[opacity,transform] duration-200 ease-out',
                                    t.visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                                )}
                            >
                                <div className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-success">
                                    <Check className="size-3 text-white" strokeWidth={3} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-body-sm font-medium text-foreground">Goal created</p>
                                    <p className="mt-0.5 truncate text-body-sm text-muted-foreground">{saved.title}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onViewGoal(saved.id)
                                            toast.dismiss(t.id)
                                        }}
                                        className="mt-2 text-body-sm font-medium text-primary transition-transform active:scale-[0.96]"
                                    >
                                        View goal
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toast.dismiss(t.id)}
                                    aria-label="Dismiss"
                                    className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        ),
                        { duration: 4000 }
                    )
                },
            })
            return goal
        },
        [createGoalMutation, onViewGoal]
    )

    const addRecentToGoal = useCallback(
        (goalId: string, title: string) => {
            addGoalRecentMutation.mutate({ goalId, title })
            toast.success('Added to goal — pace updated')
        },
        [addGoalRecentMutation]
    )

    const resetDemo = useCallback(() => {
        toast.dismiss()
        setCreatedGoalIds([])
        setIsFlowOpen(false)
        setIsOnboarding(false)
        setFreshAccount(false)
        setAiOffline(false)
        setConsolidationDismissed(false)
        setMirrorGoalId(null)
        setRepairGoalId(null)
        setPendingViewGoalId(null)
    }, [])

    const value = useMemo<TGoalCreation>(
        () => ({
            iteration,
            setIteration: (i: TIteration) => {
                setIteration(i)
                setIsFlowOpen(false)
            },
            isOnboarding,
            setIsOnboarding,
            freshAccount,
            setFreshAccount,
            aiOffline,
            setAiOffline,
            createdGoals,
            allGoals: freshAccount ? createdGoals : persistedGoals,
            createGoal,
            addRecentToGoal,
            isFlowOpen,
            openFlow: () => setIsFlowOpen(true),
            closeFlow: () => setIsFlowOpen(false),
            consolidationDismissed,
            dismissConsolidation: () => setConsolidationDismissed(true),
            mirrorGoalId,
            setMirrorGoalId,
            applyGoalRepair,
            repairGoalId,
            setRepairGoalId,
            taskGoalLinks,
            linkTaskToGoal,
            goalIdForTask: (taskId: string, optimisticId?: string) =>
                taskGoalLinks[taskId] ?? (optimisticId ? taskGoalLinks[optimisticId] : undefined),
            pendingViewGoalId,
            consumePendingViewGoal: () => setPendingViewGoalId(null),
            resetDemo,
        }),
        [
            taskGoalLinks,
            linkTaskToGoal,
            pendingViewGoalId,
            persistedGoals,
            iteration,
            isOnboarding,
            freshAccount,
            aiOffline,
            createdGoals,
            isFlowOpen,
            consolidationDismissed,
            mirrorGoalId,
            repairGoalId,
            createGoal,
            addRecentToGoal,
            applyGoalRepair,
            resetDemo,
        ]
    )
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
