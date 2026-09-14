import { Toaster } from 'react-hot-toast'
import CoachFlow from './coach/CoachFlow'
import { DETECTED_NOTE, MIRROR_DRAFT } from './lab/demoPersona'
import InferredGoalsList from './onboarding/InferredGoalsList'
import { OnboardingFrame } from './onboarding/OnboardingFrame'
import ScaffoldFlow from './scaffold/ScaffoldFlow'
import CreationModal from './shared/CreationModal'
import { isLabMode, useGoalCreation } from './shared/GoalCreationContext'
import { IterationSwitcher } from './shared/IterationSwitcher'
import ReviewScreen from './shared/ReviewScreen'

/**
 * Iteration 3 — The Mirror. The system already inferred the goal, so there is no
 * chat and no stepper: the flow opens straight onto the prefilled ReviewScreen
 * with its provenance note. In onboarding it hands off to InferredGoalsList
 * (rendered inline inside OnboardingFrame's step 2, which chooses to confirm the
 * portfolio card into this same ReviewScreen).
 */
const MirrorFlow = () => {
    const { isOnboarding, closeFlow, createGoal, setMirrorGoalId } = useGoalCreation()

    if (isOnboarding) return <InferredGoalsList />

    return (
        <CreationModal open onClose={closeFlow} breadcrumb="Suggested goal">
            <ReviewScreen
                draft={MIRROR_DRAFT}
                detectedNote={DETECTED_NOTE}
                onConfirm={(draft) => setMirrorGoalId(createGoal(draft).id)}
            />
        </CreationModal>
    )
}

const GoalCreationFlows = () => {
    const { iteration, isFlowOpen, isOnboarding } = useGoalCreation()
    const activeIteration = isLabMode ? iteration : 'scaffold'

    // Each iteration owns its own surface.
    const flow =
        isFlowOpen && activeIteration === 'coach' ? (
            <CoachFlow />
        ) : isFlowOpen && activeIteration === 'scaffold' ? (
            <ScaffoldFlow />
        ) : isFlowOpen && activeIteration === 'mirror' ? (
            <MirrorFlow />
        ) : null

    return (
        <>
            <IterationSwitcher />
            {isOnboarding && isFlowOpen ? <OnboardingFrame>{flow}</OnboardingFrame> : flow}
            <Toaster position="bottom-right" />
        </>
    )
}
export default GoalCreationFlows
