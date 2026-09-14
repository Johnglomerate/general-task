import { useEffect, useRef, useState } from 'react'
import {
    GTDialog,
    GTDialogBody,
    GTDialogFooter,
    GTDialogProperties,
    GTDialogTextarea,
    GTDialogTitleInput,
} from '@/components/ui/gt-dialog'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { useCreateTask, useModifyTask } from '../../services/api/tasks.hooks'
import { useOptionalGoalCreation } from '../goals/creation/shared/GoalCreationContext'
import FolderSelector from '../molecules/FolderSelector'
import GTDatePicker from '../molecules/GTDatePicker'
import GoalSelector from '../molecules/GoalSelector'
import PriorityDropdown from '../radix/PriorityDropdown'
import Tip from '../radix/Tip'

// The reference dialog: every other modal follows this layout via the GTDialog shell.
// Borderless title + description, one property row, Cancel/Create footer. ⌘/Ctrl+Enter creates, Escape closes.

// GTDatePicker reports "cleared" as the epoch date; treat both '' and epoch as "no due date"
const EPOCH_DATE = DateTime.fromMillis(0).toFormat('yyyy-MM-dd')
const hasRealDate = (date: string) => date !== '' && date !== EPOCH_DATE

interface CreateTaskDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    /** Folder the task is created in; the user can change it from the property row. */
    folderId: string
    /** Goal the task contributes to; prefilled when composing from a goal's details. */
    goalId?: string | null
    onCreated?: (optimisticId: string) => void
}

const CreateTaskDialog = ({
    isOpen,
    onOpenChange,
    folderId: initialFolderId,
    goalId: initialGoalId = null,
    onCreated,
}: CreateTaskDialogProps) => {
    const { mutate: createTask } = useCreateTask()
    const { mutate: modifyTask } = useModifyTask()
    const goals = useOptionalGoalCreation()

    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [folderId, setFolderId] = useState(initialFolderId)
    const [dueDate, setDueDate] = useState('')
    const [priority, setPriority] = useState(0)
    const [goalId, setGoalId] = useState<string | null>(initialGoalId)
    const bodyRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!isOpen) return
        setTitle('')
        setBody('')
        setFolderId(initialFolderId)
        setDueDate('')
        setPriority(0)
        setGoalId(initialGoalId)
    }, [isOpen, initialFolderId, initialGoalId])

    const canCreate = title.trim().length > 0

    const handleCreate = () => {
        if (!canCreate) return
        const optimisticId = uuidv4()
        createTask({ title: title.trim(), body: body.trim() || undefined, id_folder: folderId, optimisticId })
        const hasDueDate = hasRealDate(dueDate)
        if (hasDueDate || priority !== 0) {
            modifyTask(
                {
                    id: optimisticId,
                    ...(hasDueDate && { dueDate }),
                    ...(priority !== 0 && { priorityNormalized: priority }),
                },
                optimisticId
            )
        }
        if (goalId) goals?.linkTaskToGoal(optimisticId, goalId)
        onCreated?.(optimisticId)
        onOpenChange(false)
    }

    return (
        <GTDialog open={isOpen} onOpenChange={onOpenChange} label="New task" onSubmit={handleCreate}>
            <GTDialogBody>
                <GTDialogTitleInput
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                            e.preventDefault()
                            bodyRef.current?.focus()
                        }
                    }}
                    placeholder="Task title"
                />
                <GTDialogTextarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Add a description…"
                />
            </GTDialogBody>
            <GTDialogProperties>
                <Tip content="Due date" fitContent>
                    <GTDatePicker initialDate={DateTime.fromISO(dueDate)} setDate={setDueDate} />
                </Tip>
                <Tip content="Folder" fitContent>
                    <FolderSelector value={folderId} onChange={setFolderId} />
                </Tip>
                <Tip content="Priority" fitContent>
                    <PriorityDropdown value={priority} onChange={setPriority} />
                </Tip>
                <GoalSelector value={goalId} onChange={setGoalId} />
            </GTDialogProperties>
            <GTDialogFooter
                onCancel={() => onOpenChange(false)}
                onConfirm={handleCreate}
                confirmLabel="Create"
                confirmDisabled={!canCreate}
            />
        </GTDialog>
    )
}

export default CreateTaskDialog
