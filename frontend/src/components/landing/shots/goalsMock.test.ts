import { HERO_GOALS, expectedAt, statusAt, valueAt, valueLabel } from './goalsMock'

const goalA = HERO_GOALS[0]
const goalC = HERO_GOALS[2]

describe('goalsMock', () => {
    it('counts completed concerts on the day they happen', () => {
        const before = new Date(goalA.start.getFullYear(), 8, 2)
        const afterFirst = new Date(goalA.start.getFullYear(), 8, 3)
        expect(valueAt(goalA, before)).toBe(0)
        expect(valueAt(goalA, afterFirst)).toBe(1)
        expect(valueLabel(goalA, 3)).toBe('3 of 12')
    })

    it('treats a self-graded goal as the latest percent at or before the date', () => {
        const year = goalC.start.getFullYear()
        expect(valueAt(goalC, new Date(year, 7, 19))).toBe(0)
        expect(valueAt(goalC, new Date(year, 7, 20))).toBe(20)
        expect(valueAt(goalC, new Date(year, 9, 15))).toBe(70)
        expect(valueLabel(goalC, 20)).toBe('20%')
    })

    it('marks a goal on track when value is near the expected pace', () => {
        const year = goalA.start.getFullYear()
        const midSeptember = new Date(year, 8, 12)
        expect(valueAt(goalA, midSeptember)).toBe(3)
        expect(expectedAt(goalA, midSeptember)).toBeGreaterThan(0)
        expect(statusAt(goalA, midSeptember)).toBe('ok')
    })

    it('marks a goal done once the target is reached', () => {
        expect(statusAt(goalA, goalA.end)).toBe('done')
    })
})
