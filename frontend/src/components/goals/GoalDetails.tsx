import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DateTime } from 'luxon'
import { DEFAULT_FOLDER_ID } from '../../constants'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { icons, logos } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import DueDate from '../atoms/DueDate'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import Tip from '../radix/Tip'
import CreateTaskDialog from '../tasks/CreateTaskDialog'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import { GoalStatusBadge } from './GoalsList'
import RepairDialog from './RepairDialog'
import { useGoalCreation } from './creation/shared/GoalCreationContext'
import { linkedTasksForGoal, withLinkedContributions } from './goalTasks'
import { TGoal, TGoalWeekActivity } from './goalTypes'

/** Same idiom as TaskDetails: one horizontal row of property chips, the label becomes the tooltip. */
const PropertyChip = ({
    label,
    icon,
    children,
}: {
    label: string
    icon?: React.ReactNode
    children: React.ReactNode
}) => (
    <Tip content={label} fitContent>
        <Badge
            variant="secondary"
            className="h-7 gap-1.5 whitespace-nowrap text-body-md font-medium text-secondary-foreground"
        >
            {icon}
            {children}
        </Badge>
    </Tip>
)

const ContributorChip = ({ kind, label }: { kind: string; label: string }) => (
    <PropertyChip
        label="Contributor"
        icon={
            kind === 'recurring' ? (
                <Icon icon={icons.arrows_repeat} color="gray" size="small" />
            ) : kind === 'folder' ? (
                <Icon icon={icons.folder} color="gray" size="small" />
            ) : kind === 'source' ? (
                <Icon icon={logos.linear} size="small" />
            ) : (
                <Icon icon={icons.user} color="gray" size="small" />
            )
        }
    >
        {label}
    </PropertyChip>
)

/** Which of the four visual states a week is in; "current" is an outline layered on top, not a state. */
type TWeekCell = { label: string; range: string; activity: TGoalWeekActivity | 'future'; isCurrent: boolean }

const WEEK_CELL_STYLE: Record<TWeekCell['activity'], string> = {
    complete: 'bg-success/15 text-success',
    partial: 'bg-gt-gold/20 text-gt-gold',
    none: 'bg-destructive/10 text-destructive',
    future: 'bg-muted text-muted-foreground',
}

const buildWeekCells = (weeks: TGoalWeekActivity[], startDate: string, asOf?: string): TWeekCell[] => {
    const start = DateTime.fromISO(startDate).startOf('day')
    const today = (asOf ? DateTime.fromISO(asOf) : DateTime.now()).startOf('day')
    const elapsed = Math.floor(today.diff(start, 'weeks').weeks) // 0-based index of the current week
    const total = Math.max(weeks.length, elapsed + 1)
    return Array.from({ length: total }, (_, i) => {
        const from = start.plus({ weeks: i })
        const to = from.plus({ days: 6 })
        const sameMonth = from.month === to.month
        const range = sameMonth
            ? `${from.toFormat('MMM d')}–${to.toFormat('d')}`
            : `${from.toFormat('MMM d')}–${to.toFormat('MMM d')}`
        return {
            label: `W${i + 1}`,
            range,
            activity: i > elapsed ? 'future' : weeks[i] ?? 'none',
            isCurrent: i === elapsed,
        }
    })
}

/** One cell per week: label + date range, tinted by how much of the cadence landed; the current week is outlined. */
const CadenceStrip = ({ weeks, startDate, asOf }: { weeks: TGoalWeekActivity[]; startDate: string; asOf?: string }) => {
    const cells = useMemo(() => buildWeekCells(weeks, startDate, asOf), [weeks, startDate, asOf])
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5">
            {cells.map((cell) => (
                <div
                    key={cell.label}
                    className={cn(
                        'flex flex-col items-center rounded-md px-1 py-1.5 text-center',
                        WEEK_CELL_STYLE[cell.activity],
                        cell.isCurrent && 'ring-2 ring-foreground ring-offset-1 ring-offset-background'
                    )}
                    title={`${cell.label} · ${cell.range}`}
                >
                    <span className="text-label-md">{cell.label}</span>
                    <span className="whitespace-nowrap text-[11px] leading-4 opacity-80">{cell.range}</span>
                </div>
            ))}
        </div>
    )
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="text-label-md uppercase tracking-wider text-muted-foreground">{children}</span>
)

/** A linked task, rendered in the same rhythm as a subtask row. */
const LinkedTaskRow = ({ task, onUnlink }: { task: TTaskV4; onUnlink: () => void }) => (
    <div className="group flex items-center gap-2 border-b border-hairline py-2 pl-2 pr-1">
        <MarkTaskDoneButton taskId={task.id} sectionId={task.id_folder} isDone={task.is_done} isSelected={false} />
        <span
            className={cn('min-w-0 flex-1 truncate text-body-md', task.is_done && 'text-muted-foreground line-through')}
        >
            {task.title}
        </span>
        <DueDate date={DateTime.fromISO(task.due_date)} isDoneOrDeleted={task.is_done || task.is_deleted} />
        <span className="opacity-0 transition-opacity group-hover:opacity-100">
            <GTButton styleType="icon" icon={icons.x} tooltipText="Remove from goal" onClick={onUnlink} />
        </span>
    </div>
)

/**
 * Attach an existing task: searchable list of open, unlinked tasks. Linear's "add existing
 * issues to a project", but one task at a time — this is a tiny surface.
 */
const AttachTaskPopover = ({ candidates, onPick }: { candidates: TTaskV4[]; onPick: (task: TTaskV4) => void }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const q = query.trim().toLowerCase()
    const matches = candidates.filter((t) => !q || t.title.toLowerCase().includes(q)).slice(0, 8)
    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) setQuery('')
            }}
        >
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-muted-foreground">
                    <Icon icon={icons.link} color="gray" size="small" />
                    Attach existing
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-1">
                <Input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks…"
                    className="mb-1 h-8"
                />
                {matches.length === 0 ? (
                    <p className="px-2 py-2 text-body-sm text-muted-foreground">No open tasks match.</p>
                ) : (
                    matches.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                                onPick(t)
                                setOpen(false)
                                setQuery('')
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body-sm text-foreground transition-colors hover:bg-muted"
                        >
                            <span className="min-w-0 flex-1 truncate">{t.title}</span>
                            <DueDate date={DateTime.fromISO(t.due_date)} isDoneOrDeleted={false} />
                        </button>
                    ))
                )}
            </PopoverContent>
        </Popover>
    )
}

interface GoalDetailsProps {
    goal: TGoal
}
const GoalDetails = ({ goal: baseGoal }: GoalDetailsProps) => {
    const { setRepairGoalId, taskGoalLinks, linkTaskToGoal } = useGoalCreation()
    const { data: tasks } = useGetTasksV4()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const linked = useMemo(
        () => linkedTasksForGoal(baseGoal.id, tasks, taskGoalLinks),
        [baseGoal.id, tasks, taskGoalLinks]
    )
    const goal = useMemo(() => withLinkedContributions(baseGoal, linked), [baseGoal, linked])
    const candidates = useMemo(
        () => (tasks ?? []).filter((t) => !t.is_done && !t.is_deleted && !t.id_parent && !taskGoalLinks[t.id]),
        [tasks, taskGoalLinks]
    )
    const doneCount = linked.filter((t) => t.is_done).length
    const typeLabel = goal.goalType === 'time' ? 'Time-based' : 'Consistency'

    return (
        <DetailsViewTemplate>
            {/* Status sits above the title as the eyebrow; the panel is always open, so no edit/close chrome. */}
            <Tip content="Status" fitContent>
                <span className="flex self-start">
                    <GoalStatusBadge status={goal.status} />
                </span>
            </Tip>
            <h2 className="min-w-0 text-title-lg text-foreground">{goal.title}</h2>

            <div className="flex flex-row flex-wrap items-center gap-2 py-1">
                <PropertyChip label="Timeframe" icon={<Icon icon={icons.calendar_blank} color="gray" size="small" />}>
                    {goal.timeframeLabel}
                </PropertyChip>
                <PropertyChip label="Target" icon={<Icon icon={icons.check_circle_wavy} color="gray" size="small" />}>
                    {goal.targetLabel}
                </PropertyChip>
                <PropertyChip label="Goal type">{typeLabel}</PropertyChip>
                {goal.contributors.map((c) => (
                    <ContributorChip key={c.label} kind={c.kind} label={c.label} />
                ))}
            </div>

            {goal.status === 'off_track' && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/60 py-2 pl-3 pr-2 animate-in fade-in-0 slide-in-from-top-1">
                    <p className="min-w-0 text-body-sm text-secondary-foreground">
                        This goal is off track — decide how to get back on.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto shrink-0 active:scale-[0.96]"
                        onClick={() => setRepairGoalId(goal.id)}
                    >
                        Repair
                    </Button>
                </div>
            )}

            <div className="h-2" />

            <div className="flex items-baseline gap-2">
                <span className="text-body-sm font-semibold text-foreground">{goal.progressLabel}</span>
                <span className="text-body-sm text-muted-foreground">{Math.round(goal.progress * 100)}% complete</span>
            </div>
            {goal.weeks && goal.startDate && (
                <CadenceStrip weeks={goal.weeks} startDate={goal.startDate} asOf={goal.asOf} />
            )}
            {goal.footnote && <p className="text-body-sm italic text-muted-foreground">{goal.footnote}</p>}

            <div className="h-2" />

            {/* Linked tasks: the concrete work behind the plan. Completing one is a contribution.
                Actions sit under the list so a new task appends right above them. */}
            <div className="flex items-center gap-2">
                <SectionLabel>Tasks</SectionLabel>
                {linked.length > 0 && (
                    <span className="text-label-md tabular-nums text-muted-foreground/60">
                        {doneCount} of {linked.length} done
                    </span>
                )}
            </div>
            {linked.length > 0 && (
                <div className="flex flex-col">
                    {linked.map((t) => (
                        <LinkedTaskRow key={t.id} task={t} onUnlink={() => linkTaskToGoal(t.id, null)} />
                    ))}
                </div>
            )}
            <div className="flex items-center gap-1">
                <AttachTaskPopover candidates={candidates} onPick={(t) => linkTaskToGoal(t.id, goal.id)} />
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-muted-foreground"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Icon icon={icons.plus} color="gray" size="small" />
                    New task
                </Button>
            </div>
            <CreateTaskDialog
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                folderId={DEFAULT_FOLDER_ID}
                goalId={goal.id}
            />

            <div className="mt-auto flex gap-2 pt-4">
                <Button variant="outline" size="sm">
                    {goal.progressMode === 'manual' ? 'Update progress' : 'Log progress manually'}
                </Button>
            </div>

            <RepairDialog />
        </DetailsViewTemplate>
    )
}

export default GoalDetails
