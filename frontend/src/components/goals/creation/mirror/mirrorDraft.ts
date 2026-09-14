import { SCENARIO_DRAFT, TGoalDraft } from '../shared/scenario'

/**
 * The Mirror's inferred goal. Same scripted plan the other iterations land on,
 * but titled the way the system would phrase it when *it* proposes the goal —
 * shorter, observational, drawn from the tasks it already sees.
 */
export const MIRROR_DRAFT: TGoalDraft = { ...SCENARIO_DRAFT, title: 'Rebuild my portfolio' }

/** The provenance line the ReviewScreen shows under the title — "here's how I knew." */
export const DETECTED_NOTE = 'Detected from 14 existing tasks across Personal and Work'
