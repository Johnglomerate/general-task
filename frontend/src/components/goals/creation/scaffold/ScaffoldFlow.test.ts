import { buildScaffoldReviewDraft, draftGoalPaths } from './ScaffoldFlow'
import { TGoalDraft } from '../shared/scenario'

const unrelatedDraft = (): TGoalDraft => ({
    title: 'Lose 20 pounds',
    why: '',
    timeframeLabel: 'This quarter',
    capacityLabel: '~4 hrs / week',
    items: [],
})

describe('ScaffoldFlow drafting', () => {
    it('returns no scripted paths before the real drafting call exists', async () => {
        await expect(draftGoalPaths(unrelatedDraft())).resolves.toEqual([])
    })

    it('keeps unrelated goals on an empty manual plan when no draft paths return', () => {
        const draft = buildScaffoldReviewDraft(unrelatedDraft(), [])
        const serializedDraft = JSON.stringify(draft)

        expect(draft.items).toEqual([])
        expect(serializedDraft).not.toMatch(/portfolio|freelance|outreach|case study|client/i)
    })
})
