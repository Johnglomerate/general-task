import { TDraftPlanItem, TGoalDraft, buildGoalFromDraft } from './scenario'

const baseItems = (): TDraftPlanItem[] => [
    { id: 'i-workout', kind: 'cadence', title: 'Strength training', frequencyLabel: '3x / week', included: true },
    { id: 'i-meal-plan', kind: 'oneoff', title: 'Plan weekday meals', included: true },
    { id: 'i-first-checkpoint', kind: 'milestone', title: 'First progress check-in', included: true },
]

const draftWithItems = (items = baseItems()): TGoalDraft => ({
    title: 'Lose weight steadily',
    why: 'I want better energy and long-term health.',
    timeframeLabel: 'This quarter',
    capacityLabel: '~4 hrs / week',
    items,
})

const draftWithout = (kind: string): TGoalDraft => ({
    ...draftWithItems(),
    items: baseItems().map((i) => (i.kind === kind ? { ...i, included: false } : i)),
})

describe('buildGoalFromDraft', () => {
    it('builds a cadence-mode goal from a draft with cadence items', () => {
        const goal = buildGoalFromDraft(draftWithItems())
        expect(goal.title).toBe('Lose weight steadily')
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
        expect(buildGoalFromDraft(draftWithItems()).id).not.toBe(buildGoalFromDraft(draftWithItems()).id)
    })

    it('does not add portfolio items to unrelated goals', () => {
        const goal = buildGoalFromDraft({
            title: 'Lose 20 pounds',
            why: '',
            timeframeLabel: 'This year',
            capacityLabel: '~4 hrs / week',
            items: [],
        })
        const serializedGoal = JSON.stringify(goal)

        expect(goal.contributors).toEqual([])
        expect(serializedGoal).not.toMatch(/portfolio|freelance|outreach|case study|client/i)
    })
})
