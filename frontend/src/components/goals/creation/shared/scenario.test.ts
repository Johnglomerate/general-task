import { TGoalDraft, buildGoalFromDraft } from './scenario'

const BASE_DRAFT: TGoalDraft = {
    title: 'Run a 5K',
    why: 'I want a steady training habit.',
    timeframeLabel: 'Next 12 weeks',
    capacityLabel: '~4 hrs / week',
    items: [
        { id: 'i-run', kind: 'cadence', title: 'Run training sessions', frequencyLabel: '3x / week', included: true },
        { id: 'i-shoes', kind: 'oneoff', title: 'Buy running shoes', included: true },
        { id: 'i-race', kind: 'milestone', title: 'Finish race day', included: true },
    ],
}

const draftWithout = (kind: string): TGoalDraft => ({
    ...BASE_DRAFT,
    items: BASE_DRAFT.items.map((i) => (i.kind === kind ? { ...i, included: false } : i)),
})

describe('buildGoalFromDraft', () => {
    it('builds a cadence-mode goal from a draft', () => {
        const goal = buildGoalFromDraft(BASE_DRAFT)
        expect(goal.title).toBe('Run a 5K')
        expect(goal.progressMode).toBe('cadence')
        expect(goal.progress).toBe(0)
        expect(goal.status).toBe('on_track')
        expect(goal.contributors.some((c) => c.kind === 'recurring' && c.label.includes('3x / week'))).toBe(true)
    })
    it('falls back to manual mode when no cadences are included', () => {
        expect(buildGoalFromDraft(draftWithout('cadence')).progressMode).toBe('manual')
    })
    it('excluded items do not become contributors', () => {
        const goal = buildGoalFromDraft(draftWithout('milestone'))
        expect(goal.contributors.some((c) => c.label.startsWith('Milestone:'))).toBe(false)
    })
    it('generates unique ids across calls', () => {
        expect(buildGoalFromDraft(BASE_DRAFT).id).not.toBe(buildGoalFromDraft(BASE_DRAFT).id)
    })
    it('does not add portfolio items to an unrelated empty-plan goal', () => {
        const goal = buildGoalFromDraft({
            title: 'Lose weight',
            why: '',
            timeframeLabel: 'No timeframe set',
            capacityLabel: 'No capacity set',
            items: [],
        })

        expect(goal.title).toBe('Lose weight')
        expect(goal.contributors).toHaveLength(0)
        expect(goal.contributors.some((c) => /portfolio|outreach|case study|client/i.test(c.label))).toBe(false)
    })
})
