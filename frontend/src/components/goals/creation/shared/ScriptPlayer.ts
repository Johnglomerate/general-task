import { useEffect, useState } from 'react'

export type TScriptStep =
    | { type: 'ai'; text: string; typingMs?: number }
    | { type: 'user'; text: string }
    | { type: 'action'; label: string }

export interface TChatMessage {
    role: 'ai' | 'user'
    text: string
}

export interface TScriptState {
    messages: TChatMessage[]
    isTyping: boolean
    pendingUser: string | null
    pendingAction: string | null
    done: boolean
}

const INITIAL: TScriptState = { messages: [], isTyping: false, pendingUser: null, pendingAction: null, done: false }

export class ScriptPlayer {
    private index = 0
    private timer: ReturnType<typeof setTimeout> | null = null
    private listeners = new Set<() => void>()
    private state: TScriptState = INITIAL

    constructor(private steps: TScriptStep[]) {}

    getState() {
        return this.state
    }
    subscribe(fn: () => void) {
        this.listeners.add(fn)
        return () => {
            this.listeners.delete(fn)
        }
    }
    private emit(next: Partial<TScriptState>) {
        this.state = { ...this.state, ...next }
        this.listeners.forEach((l) => l())
    }

    start() {
        this.advance()
    }
    private advance() {
        const step = this.steps[this.index]
        if (!step) {
            this.emit({ done: true })
            return
        }
        if (step.type === 'ai') {
            this.emit({ isTyping: true })
            this.timer = setTimeout(() => {
                this.index++
                this.emit({ isTyping: false, messages: [...this.state.messages, { role: 'ai', text: step.text }] })
                this.advance()
            }, step.typingMs ?? 900)
        } else if (step.type === 'user') {
            this.emit({ pendingUser: step.text })
        } else {
            this.emit({ pendingAction: step.label })
        }
    }
    send() {
        const step = this.steps[this.index]
        if (!step || step.type !== 'user') return
        this.index++
        this.emit({ pendingUser: null, messages: [...this.state.messages, { role: 'user', text: step.text }] })
        this.advance()
    }
    trigger() {
        const step = this.steps[this.index]
        if (!step || step.type !== 'action') return
        this.index++
        this.emit({ pendingAction: null })
        this.advance()
    }
    reset() {
        if (this.timer) clearTimeout(this.timer)
        this.index = 0
        this.state = INITIAL
        this.listeners.forEach((l) => l())
    }
}

export const useScriptPlayer = (steps: TScriptStep[]) => {
    const [player] = useState(() => new ScriptPlayer(steps))
    const [state, setState] = useState(player.getState())
    useEffect(() => {
        const unsub = player.subscribe(() => setState(player.getState()))
        player.start()
        return () => {
            unsub()
            player.reset()
        }
    }, [player])
    return {
        state,
        send: () => player.send(),
        trigger: () => player.trigger(),
        restart: () => {
            player.reset()
            player.start()
        },
    }
}
