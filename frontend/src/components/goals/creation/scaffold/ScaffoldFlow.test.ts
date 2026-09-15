import { buildScaffoldReviewDraft, draftGoalPlan } from './ScaffoldFlow'
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

    it('drafts a plan from the user goal through the backend', async () => {
        mockedApiClient.post.mockResolvedValueOnce({
            data: {
                plan: {
                    type: 'consistency',
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
                            frequencyLabel: '3× / week',
                            included: true,
                        },
                    ],
                },
            },
        })

        await expect(draftGoalPlan(unrelatedDraft())).resolves.toEqual(expect.objectContaining({ type: 'consistency' }))
        expect(mockedApiClient.post).toHaveBeenCalledWith('/goals/draft/', {
            title: 'Lose 20 pounds',
            why: '',
            timeframeLabel: 'This quarter',
            capacityLabel: '~4 hrs / week',
        })
    })

    it('falls back to a manual plan when drafting fails', async () => {
        mockedApiClient.post.mockRejectedValueOnce(new Error('network failed'))
        await expect(draftGoalPlan(unrelatedDraft())).resolves.toBeNull()
    })

    it('keeps unrelated goals on an empty manual plan when no draft plan returns', () => {
        const draft = buildScaffoldReviewDraft(unrelatedDraft(), null)
        const serializedDraft = JSON.stringify(draft)

        expect(draft.items).toEqual([])
        expect(serializedDraft).not.toMatch(/portfolio|freelance|outreach|case study|client/i)
    })
})
