import { ScriptPlayer, TScriptStep } from './ScriptPlayer'

const STEPS: TScriptStep[] = [
    { type: 'ai', text: 'hello', typingMs: 500 },
    { type: 'user', text: 'hi back' },
    { type: 'ai', text: 'question?', typingMs: 500 },
    { type: 'action', label: 'Review the plan' },
]

describe('ScriptPlayer', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('types then emits ai message, pausing at the user step', () => {
        const p = new ScriptPlayer(STEPS)
        p.start()
        expect(p.getState().isTyping).toBe(true)
        jest.advanceTimersByTime(500)
        expect(p.getState().messages).toEqual([{ role: 'ai', text: 'hello' }])
        expect(p.getState().pendingUser).toBe('hi back')
    })

    it('send() commits the user message and continues to the action step', () => {
        const p = new ScriptPlayer(STEPS)
        p.start()
        jest.advanceTimersByTime(500)
        p.send()
        expect(p.getState().messages[1]).toEqual({ role: 'user', text: 'hi back' })
        jest.advanceTimersByTime(500)
        expect(p.getState().pendingAction).toBe('Review the plan')
        p.trigger()
        expect(p.getState().done).toBe(true)
    })

    it('send() is a no-op while typing', () => {
        const p = new ScriptPlayer(STEPS)
        p.start()
        p.send()
        expect(p.getState().messages).toEqual([])
    })

    it('reset() clears state and pending timers', () => {
        const p = new ScriptPlayer(STEPS)
        p.start()
        p.reset()
        jest.advanceTimersByTime(2000)
        expect(p.getState()).toEqual({
            messages: [],
            isTyping: false,
            pendingUser: null,
            pendingAction: null,
            done: false,
        })
    })

    it('notifies subscribers on every emit', () => {
        const p = new ScriptPlayer(STEPS)
        const spy = jest.fn()
        p.subscribe(spy)
        p.start()
        jest.advanceTimersByTime(500)
        expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
})
