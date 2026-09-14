import { SCENARIO_DRAFT, TGoalDraft, buildGoalFromDraft } from './scenario'

const draftWithout = (kind: string): TGoalDraft => ({
    ...SCENARIO_DRAFT,
    items: SCENARIO_DRAFT.items.map((i) => (i.kind === kind ? { ...i, included: false } : i)),
})

describe('buildGoalFromDraft', () => {
    it('builds a cadence-mode goal from the scenario draft', () => {
        const goal = buildGoalFromDraft(SCENARIO_DRAFT)
        expect(goal.title).toBe('Rebuild my portfolio and land 3 freelance clients')
        expect(goal.progressMode).toBe('cadence')
        expect(goal.progress).toBe(0)
        expect(goal.status).toBe('on_track')
        expect(goal.contributors.some((c) => c.kind === 'recurring' && c.label.includes('2× / week'))).toBe(true)
    })
    it('falls back to manual mode when no cadences are included', () => {
        expect(buildGoalFromDraft(draftWithout('cadence')).progressMode).toBe('manual')
    })
    it('excluded items do not become contributors', () => {
        const goal = buildGoalFromDraft(draftWithout('milestone'))
        expect(goal.contributors.some((c) => c.label.startsWith('Milestone:'))).toBe(false)
    })
    it('generates unique ids across calls', () => {
        expect(buildGoalFromDraft(SCENARIO_DRAFT).id).not.toBe(buildGoalFromDraft(SCENARIO_DRAFT).id)
    })
})
