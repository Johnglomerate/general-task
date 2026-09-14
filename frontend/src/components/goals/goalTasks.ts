import { TTaskV4 } from '../../utils/types'
import { TGoal } from './goalTypes'

/**
 * Linked tasks feed the goal the same way plan items do: a completed task is a
 * contribution. For count-based goals ("5 of 12") the done count moves the meter;
 * time/manual goals only gain a "recent" entry (their ruler is hours or self-grade).
 */
export const linkedTasksForGoal = (goalId: string, tasks: TTaskV4[] | undefined, links: Record<string, string>) =>
    (tasks ?? [])
        .filter((t) => goalIdForTask(links, t) === goalId && !t.is_deleted)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)) // oldest first, so new tasks append at the bottom

/** A task's goal, whether it was linked under its real id or its optimistic id. */
export const goalIdForTask = (links: Record<string, string>, task: Pick<TTaskV4, 'id' | 'optimisticId'>) =>
    links[task.id] ?? (task.optimisticId ? links[task.optimisticId] : undefined)

const COUNT_LABEL = /^(\d+) of (\d+)$/

/** Overlay linked-task completions onto a goal's progress fields. */
export const withLinkedContributions = (goal: TGoal, linked: TTaskV4[]): TGoal => {
    const done = linked.filter((t) => t.is_done)
    if (done.length === 0) return goal
    const recent = [
        ...done.map((t) => ({ title: t.title, date: 'Today', source: 'General Task' as const })),
        ...goal.recent,
    ]
    const match = goal.progressLabel.match(COUNT_LABEL)
    if (!match) return { ...goal, recent }
    const [, current, target] = match
    const next = Math.min(Number(target), Number(current) + done.length)
    return {
        ...goal,
        recent,
        progress: next / Number(target),
        progressLabel: `${next} of ${target}`,
        weekLabel: goal.weekLabel?.replace(/^\d+/, (n) => String(Number(n) + done.length)),
    }
}
