import { TGoalDraft, TScenarioPath } from '../shared/scenario'

export type TScaffoldDraftInput = Pick<TGoalDraft, 'title' | 'why' | 'timeframeLabel' | 'capacityLabel'>

export const draftGoalPaths = async (_draft: TScaffoldDraftInput): Promise<TScenarioPath[]> => []

export const buildScaffoldReviewDraft = (
    draftInput: TScaffoldDraftInput,
    draftPaths: TScenarioPath[]
): TGoalDraft => {
    const draftedPath = draftPaths[0]
    return {
        ...draftInput,
        items: draftedPath?.items ?? [],
        phases: draftedPath?.phases,
        goalType: draftedPath?.type,
    }
}
