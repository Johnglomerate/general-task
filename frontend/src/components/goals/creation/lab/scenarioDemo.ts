import { TDraftPlanItem, TGoalDraft, TScenarioPath } from '../shared/scenario'

/** SCRIPTED DEMO DATA - one persona runs through the lab-only prototype iterations. */
export const PERSONA_CONTEXT = `I'm a product designer going independent this year. I want steady freelance work without losing my craft practice - writing case studies, keeping my portfolio sharp, and shooting concerts on weekends. I overcommit, so weekly plans need to be realistic: I have about 6 focused hours a week outside client work.`

/** Fresh copies per path so toggling items in one path never mutates the other. */
const SCENARIO_DRAFT_ITEMS = (): TDraftPlanItem[] => [
    { id: 'i-outreach', kind: 'cadence', title: 'Send outreach emails', frequencyLabel: '2x / week', included: true },
    { id: 'i-casestudy', kind: 'cadence', title: 'Publish a case study', frequencyLabel: '1x / month', included: true },
    { id: 'i-redesign', kind: 'oneoff', title: 'Redesign the portfolio site', included: true },
    { id: 'i-live', kind: 'milestone', title: 'Portfolio live', included: true },
    { id: 'i-client', kind: 'milestone', title: 'First client signed', included: true },
]

/** The two typed paths the old mock decompose call returned for the portfolio lab scenario. */
export const SCENARIO_PATHS: TScenarioPath[] = [
    {
        id: 'path-consistency',
        type: 'consistency',
        label: 'Steady sessions',
        shapeLabel: '4 sessions / week, ramping to 5',
        rationale: 'Fits a week that changes shape - you commit to showing up, not to a clock.',
        phases: [
            {
                name: 'Rebuild',
                cadenceLabel: '4 sessions / week',
                weeklyHours: 6,
                dateSpanLabel: 'Jul 14 - Aug 31',
                weeks: 7,
            },
            {
                name: 'Outreach push',
                cadenceLabel: '5 sessions / week',
                weeklyHours: 6,
                dateSpanLabel: 'Sep 1 - Oct 31',
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
        rationale: 'Fits deep-work blocks - credit the hours whenever they happen.',
        phases: [
            {
                name: 'Rebuild',
                cadenceLabel: '6 hrs / week',
                weeklyHours: 6,
                dateSpanLabel: 'Jul 14 - Aug 31',
                weeks: 7,
            },
            {
                name: 'Outreach push',
                cadenceLabel: '5 hrs / week',
                weeklyHours: 5,
                dateSpanLabel: 'Sep 1 - Oct 31',
                weeks: 9,
            },
        ],
        items: SCENARIO_DRAFT_ITEMS(),
    },
]

export const SCENARIO_DRAFT: TGoalDraft = {
    title: 'Rebuild my portfolio and land 3 freelance clients',
    why: 'Going independent only works if the work finds me - the portfolio is the engine, the clients are the proof.',
    timeframeLabel: 'Jul 14 - Oct 31',
    capacityLabel: '~6 hrs / week',
    items: SCENARIO_DRAFT_ITEMS(),
}

export const MIRROR_DRAFT: TGoalDraft = { ...SCENARIO_DRAFT, title: 'Rebuild my portfolio' }

/** The provenance line the ReviewScreen shows under the title - "here's how I knew." */
export const DETECTED_NOTE = 'Detected from 14 existing tasks across Personal and Work'
