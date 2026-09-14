export type TGoalStatus = 'on_track' | 'behind' | 'off_track' | 'paused'
export type TGoalProgressMode = 'cadence' | 'source' | 'manual'
export type TGoalType = 'consistency' | 'time'
export type TGoalWeekActivity = 'complete' | 'partial' | 'none'

export interface TGoalPhase {
    name: string
    cadenceLabel: string
    weeklyHours: number
    dateSpanLabel: string
    weeks: number
}

export interface TGoalContribution {
    title: string
    date: string
    source: 'General Task' | 'Linear' | 'Slack'
}

export interface TGoal {
    id: string
    title: string
    why: string
    timeframeLabel: string
    targetLabel: string
    paceLabel: string
    progress: number
    progressLabel: string
    status: TGoalStatus
    progressMode: TGoalProgressMode
    goalType?: TGoalType
    phases?: TGoalPhase[]
    contractLine?: string
    weekLabel?: string
    contributors: { kind: 'recurring' | 'folder' | 'source' | 'self'; label: string }[]
    startDate?: string
    asOf?: string
    weeks?: TGoalWeekActivity[]
    recent: TGoalContribution[]
    footnote?: string
    created_at?: string
    updated_at?: string
}

export const GOAL_STATUS_LABEL: Record<TGoalStatus, string> = {
    on_track: 'On track',
    behind: 'Behind',
    off_track: 'Off track',
    paused: 'Paused',
}
