import { TScriptStep } from '../shared/ScriptPlayer'

/**
 * Iteration 1 — The Coach. Authored demo dialogue: a coaching conversation that
 * pushes back on a vague goal until it becomes specific and time-bound. Module-level
 * so `useScriptPlayer` captures a stable array identity (it ignores later identities).
 * The 7th AI beat carries `typingMs: 1400` — the dramatic pause before the pushback.
 */
export const COACH_SCRIPT: TScriptStep[] = [
    {
        type: 'ai',
        text: "You mentioned you're going independent this year — let's turn that into something trackable. What's the goal?",
    },
    { type: 'user', text: 'I want to rebuild my portfolio and get more freelance clients.' },
    { type: 'ai', text: 'Why does this matter right now — what changes if it works?' },
    {
        type: 'user',
        text: 'Going independent only works if the work finds me. The portfolio is the engine, clients are the proof.',
    },
    { type: 'ai', text: 'What does done look like?' },
    { type: 'user', text: 'More clients, better portfolio.' },
    {
        type: 'ai',
        text: '“More clients” is where goals go to die. How many, by when — and how will they find you?',
        typingMs: 1400,
    },
    { type: 'user', text: 'Okay — 3 signed clients by end of October, portfolio relaunched by mid-August.' },
    { type: 'ai', text: 'Last one: how many focused hours a week can you actually give this — honestly?' },
    { type: 'user', text: 'About 6.' },
    {
        type: 'ai',
        text: "That's enough for steady outreach plus one case study a month. Here's the plan I'd propose — everything is editable.",
    },
    { type: 'action', label: 'Review the plan' },
]
