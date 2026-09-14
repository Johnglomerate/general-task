/**
 * Verdict grace formula — deterministic, relative to the goal (GOALS-V1-SCOPE §Verdicts).
 * Grace scales with runway share and tightens as the deadline nears. All tunable
 * constants live here and nowhere else; the manual-plan path uses the same numbers.
 */

export const GRACE = {
    /** Under this share of the phase's planned sessions/hours = a "quiet week". */
    weakWeekThreshold: 0.5,
    /** Grace window as a share of remaining weeks. */
    runwayShare: 0.125,
    floorWeeks: 1,
    capWeeks: 3,
    /** Open-ended goals (no deadline) get the generous default. */
    openEndedWeeks: 3,
}

/** How many quiet weeks a goal absorbs before the verdict flips to off track. */
export const graceWindowWeeks = (remainingWeeks: number | null): number => {
    if (remainingWeeks === null) return GRACE.openEndedWeeks
    return Math.min(GRACE.capWeeks, Math.max(GRACE.floorWeeks, Math.round(remainingWeeks * GRACE.runwayShare)))
}

/** The legibility rule: every goal states its contract in one plain line. */
export const contractLine = (remainingWeeks: number | null): string => {
    const w = graceWindowWeeks(remainingWeeks)
    return `Counts as off track after ${w} quiet week${w === 1 ? '' : 's'}.`
}
