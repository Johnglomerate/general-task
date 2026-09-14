import { DateTime } from 'luxon'
import { TGoal, TGoalPhase, TGoalType } from '../../goalTypes'

/** SCRIPTED DEMO DATA — one persona runs through all three iterations. */
export const PERSONA_CONTEXT = `I'm a product designer going independent this year. I want steady freelance work without losing my craft practice — writing case studies, keeping my portfolio sharp, and shooting concerts on weekends. I overcommit, so weekly plans need to be realistic: I have about 6 focused hours a week outside client work.`

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

/** Fresh copies per path so toggling items in one path never mutates the other. */
const SCENARIO_DRAFT_ITEMS = (): TDraftPlanItem[] => [
    { id: 'i-outreach', kind: 'cadence', title: 'Send outreach emails', frequencyLabel: '2× / week', included: true },
    { id: 'i-casestudy', kind: 'cadence', title: 'Publish a case study', frequencyLabel: '1× / month', included: true },
    { id: 'i-redesign', kind: 'oneoff', title: 'Redesign the portfolio site', included: true },
    { id: 'i-live', kind: 'milestone', title: 'Portfolio live', included: true },
    { id: 'i-client', kind: 'milestone', title: 'First client signed', included: true },
]

/** The two typed paths the mock decompose call returns for the portfolio scenario. */
export const SCENARIO_PATHS: TScenarioPath[] = [
    {
        id: 'path-consistency',
        type: 'consistency',
        label: 'Steady sessions',
        shapeLabel: '4 sessions / week, ramping to 5',
        rationale: 'Fits a week that changes shape — you commit to showing up, not to a clock.',
        phases: [
            {
                name: 'Rebuild',
                cadenceLabel: '4 sessions / week',
                weeklyHours: 6,
                dateSpanLabel: 'Jul 14 – Aug 31',
                weeks: 7,
            },
            {
                name: 'Outreach push',
                cadenceLabel: '5 sessions / week',
                weeklyHours: 6,
                dateSpanLabel: 'Sep 1 – Oct 31',
                weeks: 9,
            },
        ],
        items: SCENARIO_DRAFT_ITEMS(),
    },
    {
        id: 'path-time',
        type: 'time',
        label: 'Weekly hours',
        shapeLabel: '6 hrs / week against the plan',
        rationale: 'Fits deep-work blocks — credit the hours whenever they happen.',
        phases: [
            {
                name: 'Rebuild',
                cadenceLabel: '6 hrs / week',
                weeklyHours: 6,
                dateSpanLabel: 'Jul 14 – Aug 31',
                weeks: 7,
            },
            {
                name: 'Outreach push',
                cadenceLabel: '5 hrs / week',
                weeklyHours: 5,
                dateSpanLabel: 'Sep 1 – Oct 31',
                weeks: 9,
            },
        ],
        items: SCENARIO_DRAFT_ITEMS(),
    },
]

/**
 * Realism pushback (§Creation flow step 4): the scripted trigger is picking the
 * smallest capacity — the plan honestly doesn't fit, and the AI says what would.
 */
export const REALISM_TRIGGER_CAPACITY = '~4 hrs / week'
export const REALISM_WARNING = {
    message: '4 hrs a week doesn’t honestly reach “3 clients by Oct 31.”',
    fixes: [
        { id: 'fix-capacity', label: 'Plan for 6 hrs / week', capacityLabel: '~6 hrs / week' },
        { id: 'fix-runway', label: 'Extend to Dec 31', timeframeLabel: 'Jul 14 – Dec 31' },
    ],
}

export const SCENARIO_DRAFT: TGoalDraft = {
    title: 'Rebuild my portfolio and land 3 freelance clients',
    why: 'Going independent only works if the work finds me — the portfolio is the engine, the clients are the proof.',
    timeframeLabel: 'Jul 14 – Oct 31',
    capacityLabel: '~6 hrs / week',
    items: SCENARIO_DRAFT_ITEMS(),
}

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
