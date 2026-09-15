import { DateTime } from 'luxon'
import { TGoal, TGoalPhase, TGoalType } from '../../goalTypes'

export type TDraftItemKind = 'cadence' | 'oneoff' | 'milestone'

export interface TDraftPlanItem {
    id: string
    kind: TDraftItemKind
    title: string
    frequencyLabel?: string
    included: boolean
}

export interface TGoalDraft {
    title: string
    why: string
    timeframeLabel: string
    capacityLabel: string
    items: TDraftPlanItem[]
    /** Set when the user picked a typed path; manual fallback hosts an explicit picker. */
    goalType?: TGoalType
    /** Ordered plan phases — rendered as the horizontal timeline when length > 1. */
    phases?: TGoalPhase[]
}

/**
 * One AI-returned path — the decompose call returns 1–2 of these, each shaped
 * within stated capacity (GOALS-V1-SCOPE §Creation flow). The user picks the
 * one that fits their life; type is AI-inferred, user-confirmed.
 */
export interface TScenarioPath {
    id: string
    type: TGoalType
    /** Short handle for the choice card, e.g. "Steady sessions". */
    label: string
    /** The path's shape in one line, e.g. "4 focused sessions / week". */
    shapeLabel: string
    /** Why the AI thinks this framing fits — one plain sentence. */
    rationale: string
    phases: TGoalPhase[]
    items: TDraftPlanItem[]
}

export type TGoalDraftPlan = Pick<TScenarioPath, 'type' | 'phases' | 'items'>

let counter = 0
export const buildGoalFromDraft = (draft: TGoalDraft): TGoal => {
    const included = draft.items.filter((i) => i.included)
    const cadences = included.filter((i) => i.kind === 'cadence')
    const milestones = included.filter((i) => i.kind === 'milestone')
    return {
        id: `goal-created-${++counter}`,
        title: draft.title,
        why: draft.why,
        timeframeLabel: draft.timeframeLabel,
        targetLabel: milestones.length > 0 ? `${milestones.length} milestones` : 'Self-graded',
        paceLabel: 'Just created — pace starts this week',
        progress: 0,
        progressLabel: milestones.length > 0 ? `0 of ${milestones.length}` : '0%',
        status: 'on_track',
        progressMode: cadences.length > 0 ? 'cadence' : 'manual',
        goalType: draft.goalType,
        phases: draft.phases,
        contractLine: 'Counts as off track after 2 quiet weeks.',
        weekLabel:
            draft.goalType === 'time'
                ? `0 of ${draft.phases?.[0]?.weeklyHours ?? 6} hrs this week`
                : cadences.length > 0
                ? `0 of ${cadences.length} this week`
                : undefined,
        contributors: [
            ...cadences.map((c) => ({ kind: 'recurring' as const, label: `${c.title} · ${c.frequencyLabel}` })),
            ...milestones.map((m) => ({ kind: 'self' as const, label: `Milestone: ${m.title}` })),
        ],
        startDate: DateTime.now().startOf('week').toISODate(),
        weeks: cadences.length > 0 ? [] : undefined,
        recent: [],
    }
}
