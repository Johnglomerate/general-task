export const STATUS = {
    done: ['Done', 'ok', '#15803D'],
    ok: ['On track', 'ok', '#15803D'],
    warn: ['Behind', 'warn', '#A16207'],
    bad: ['Off track', 'bad', '#BE0A16'],
} as const

export type TGoalStatus = keyof typeof STATUS

const YEAR = new Date().getFullYear()
const D = (month: number, day: number) => new Date(YEAR, month - 1, day)

export type THeroGoal = {
    id: 'a' | 'b' | 'c'
    title: string
    start: Date
    end: Date
    target: number
    sub: string
    pulse?: string
    pct?: boolean
    done: [Date, string | number | undefined][]
}

export const HERO_GOALS: THeroGoal[] = [
    {
        id: 'a',
        title: 'Shoot 12 concerts this fall',
        start: D(9, 1),
        end: D(12, 31),
        target: 12,
        sub: 'Sep 1 – Dec 31 · weekly cadence',
        pulse: 'Shoot 12 concerts',
        done: [
            [D(9, 3), 'Shot Khruangbin at the Greek'],
            [D(9, 6), 'Shot No Vacation at Rickshaw Stop'],
            [D(9, 10), 'Shot Men I Trust at the Fox'],
            [D(9, 19), 'Shot Japanese Breakfast at the Fillmore'],
            [D(9, 27), 'Shot Mk.gee at the Independent'],
            [D(10, 4), 'Shot Wednesday at Bottom of the Hill'],
            [D(10, 11), 'Shot Faye Webster at the Warfield'],
            [D(10, 18), 'Shot Alvvays at the Chapel'],
            [D(10, 26), 'Shot Hovvdy at Great American'],
            [D(11, 8), 'Shot Mitski at Bill Graham'],
            [D(11, 16), 'Shot Toro y Moi at the Regency'],
            [D(12, 6), 'Shot Cigarettes After Sex at the Fox'],
        ],
    },
    {
        id: 'b',
        title: 'Close 15 tipping-v2 issues',
        start: D(8, 15),
        end: D(11, 30),
        target: 15,
        sub: 'Aug 15 – Nov 30',
        pulse: 'Close 15 tipping-v2…',
        done: [
            [D(9, 21), undefined],
            [D(9, 25), undefined],
            [D(10, 1), undefined],
            [D(10, 4), undefined],
            [D(10, 8), undefined],
            [D(10, 12), undefined],
            [D(10, 15), undefined],
            [D(10, 20), undefined],
            [D(10, 26), undefined],
            [D(11, 2), undefined],
            [D(11, 9), undefined],
            [D(11, 16), undefined],
            [D(11, 20), undefined],
            [D(11, 22), undefined],
            [D(11, 22), undefined],
        ],
    },
    {
        id: 'c',
        title: 'Get comfortable with strobe lighting',
        start: D(8, 1),
        end: D(12, 15),
        target: 100,
        pct: true,
        sub: 'By Dec 15 · self-graded',
        done: [
            [D(8, 20), 20],
            [D(9, 24), 50],
            [D(10, 15), 70],
            [D(11, 5), 85],
            [D(12, 7), 100],
        ],
    },
]

const MS_DAY = 864e5
const MS_WEEK = 6048e5

export const yearStart = () => new Date(YEAR, 0, 1)
export const daysInYear = () => (new Date(YEAR + 1, 0, 1).getTime() - yearStart().getTime()) / MS_DAY

export const dayFrac = (d: Date) => (d.getTime() - yearStart().getTime()) / MS_DAY / daysInYear()

export const formatWeekLabel = (d: Date) => {
    const start = yearStart()
    const w = Math.ceil((Math.floor((d.getTime() - start.getTime()) / MS_DAY) + start.getDay() + 1) / 7)
    return `W${w} · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
}

export const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const valueAt = (goal: THeroGoal, d: Date) => {
    if (goal.pct) {
        return goal.done.reduce<number>((v, [t, p]) => (t <= d && typeof p === 'number' ? p : v), 0)
    }
    return goal.done.filter(([t]) => t <= d).length
}

export const expectedAt = (goal: THeroGoal, d: Date) => {
    const span = goal.end.getTime() - goal.start.getTime()
    return goal.target * Math.min(1, Math.max(0, (d.getTime() - goal.start.getTime()) / span))
}

export const statusAt = (goal: THeroGoal, d: Date, v = valueAt(goal, d), e = expectedAt(goal, d)): TGoalStatus => {
    if (v >= goal.target) return 'done'
    if (v >= e - goal.target * 0.05) return 'ok'
    if (v >= e * 0.6) return 'warn'
    return 'bad'
}

export type TWeekCell = { on: boolean; now: boolean; future: boolean }

export const weekCellsAt = (goal: THeroGoal, d: Date): TWeekCell[] => {
    const weeks = Math.ceil((goal.end.getTime() - goal.start.getTime()) / MS_WEEK)
    const wkIdx = Math.floor((d.getTime() - goal.start.getTime()) / MS_WEEK)
    return Array.from({ length: weeks }, (_, i) => {
        const ws = new Date(goal.start.getTime() + i * MS_WEEK)
        const we = new Date(ws.getTime() + MS_WEEK)
        const hit = goal.done.some(([t]) => t >= ws && t < we && t <= d)
        return { on: hit, now: i === wkIdx, future: i > wkIdx }
    })
}

export const valueLabel = (goal: THeroGoal, v: number) => (goal.pct ? `${v}%` : `${v} of ${goal.target}`)

export type TContribution = { text: string; date: Date }

export const recentContributions = (goal: THeroGoal, d: Date): TContribution[] =>
    goal.done
        .filter(([t, s]) => t <= d && typeof s === 'string')
        .slice(-3)
        .reverse()
        .map(([t, s]) => ({ text: s as string, date: t }))
