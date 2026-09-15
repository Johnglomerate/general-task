import { buildScaffoldReviewDraft, draftGoalPaths } from './ScaffoldFlow'
import { TGoalDraft } from '../shared/scenario'
import apiClient from '../../../../utils/api'

jest.mock('../../../../utils/api', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}))

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const unrelatedDraft = (): TGoalDraft => ({
    title: 'Lose 20 pounds',
    why: '',
    timeframeLabel: 'This quarter',
    capacityLabel: '~4 hrs / week',
    items: [],
})

describe('ScaffoldFlow drafting', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('drafts paths from the user goal through the backend', async () => {
        mockedApiClient.post.mockResolvedValueOnce({
            data: {
                paths: [
                    {
                        id: 'steady',
                        type: 'consistency',
                        label: 'Steady habits',
                        shapeLabel: '3 actions / week',
                        rationale: 'Small weekly actions fit the stated capacity.',
                        phases: [
                            {
                                name: 'Build rhythm',
                                cadenceLabel: '3 actions / week',
                                weeklyHours: 4,
                                dateSpanLabel: 'Weeks 1-12',
                                weeks: 12,
                            },
                        ],
                        items: [
                            {
                                id: 'workout',
                                kind: 'cadence',
                                title: 'Strength training',
                                frequencyLabel: '3x / week',
                                included: true,
                            },
                        ],
                    },
                ],
            },
        })

        await expect(draftGoalPaths(unrelatedDraft())).resolves.toEqual([
            expect.objectContaining({ id: 'steady', type: 'consistency' }),
        ])
        expect(mockedApiClient.post).toHaveBeenCalledWith('/goals/draft/', {
            title: 'Lose 20 pounds',
            why: '',
            timeframeLabel: 'This quarter',
            capacityLabel: '~4 hrs / week',
        })
    })

    it('falls back to a manual plan when drafting fails', async () => {
        mockedApiClient.post.mockRejectedValueOnce(new Error('network failed'))
        await expect(draftGoalPaths(unrelatedDraft())).resolves.toEqual([])
    })

    it('keeps unrelated goals on an empty manual plan when no draft paths return', () => {
        const draft = buildScaffoldReviewDraft(unrelatedDraft(), [])
        const serializedDraft = JSON.stringify(draft)

        expect(draft.items).toEqual([])
        expect(serializedDraft).not.toMatch(/portfolio|freelance|outreach|case study|client/i)
    })
})
