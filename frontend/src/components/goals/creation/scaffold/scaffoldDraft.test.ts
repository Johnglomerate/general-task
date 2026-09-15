import { buildScaffoldReviewDraft } from './scaffoldDraft'

describe('buildScaffoldReviewDraft', () => {
    it('does not add portfolio items to an unrelated empty-path goal', () => {
        const draft = buildScaffoldReviewDraft(
            {
                title: 'Lose weight',
                why: '',
                timeframeLabel: 'No timeframe set',
                capacityLabel: 'No capacity set',
            },
            []
        )

        expect(draft.title).toBe('Lose weight')
        expect(draft.items).toHaveLength(0)
        expect(draft.items.some((i) => /portfolio|outreach|case study|client/i.test(i.title))).toBe(false)
    })
})
