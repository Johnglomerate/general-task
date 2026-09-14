import { TDraftPlanItem, TGoalDraft } from '../shared/scenario'

/** SCRIPTED LAB DATA - one persona runs through the coach and mirror demos. */
export const PERSONA_CONTEXT = `I'm a product designer going independent this year. I want steady freelance work without losing my craft practice - writing case studies, keeping my portfolio sharp, and shooting concerts on weekends. I overcommit, so weekly plans need to be realistic: I have about 6 focused hours a week outside client work.`

/** Fresh copies per path so toggling items in one path never mutates the other. */
const SCENARIO_DRAFT_ITEMS = (): TDraftPlanItem[] => [
    { id: 'i-outreach', kind: 'cadence', title: 'Send outreach emails', frequencyLabel: '2× / week', included: true },
    { id: 'i-casestudy', kind: 'cadence', title: 'Publish a case study', frequencyLabel: '1× / month', included: true },
    { id: 'i-redesign', kind: 'oneoff', title: 'Redesign the portfolio site', included: true },
    { id: 'i-live', kind: 'milestone', title: 'Portfolio live', included: true },
    { id: 'i-client', kind: 'milestone', title: 'First client signed', included: true },
]

export const SCENARIO_DRAFT: TGoalDraft = {
    title: 'Rebuild my portfolio and land 3 freelance clients',
    why: 'Going independent only works if the work finds me — the portfolio is the engine, the clients are the proof.',
    timeframeLabel: 'Jul 14 – Oct 31',
    capacityLabel: '~6 hrs / week',
    items: SCENARIO_DRAFT_ITEMS(),
}

export const MIRROR_DRAFT: TGoalDraft = { ...SCENARIO_DRAFT, title: 'Rebuild my portfolio' }

export const DETECTED_NOTE = 'Detected from 14 existing tasks across Personal and Work'
