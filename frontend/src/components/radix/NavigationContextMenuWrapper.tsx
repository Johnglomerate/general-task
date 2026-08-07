import { DEFAULT_FOLDER_ID } from '../../constants'
import { useDeleteFolder, useGetFolders, useModifyFolder } from '../../services/api/folders.hooks'
import { icons } from '../../styles/images'
import { TTaskFolder } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface NavigationContextMenuWrapperProps {
    children: React.ReactNode
    folder: TTaskFolder
    setSectionBeingEdited: (folder: TTaskFolder) => void
}
const NavigationContextMenuWrapper = ({
    children,
    folder,
    setSectionBeingEdited,
}: NavigationContextMenuWrapperProps) => {
    const { mutate: deleteFolder } = useDeleteFolder()
    const { mutate: modifyFolder } = useModifyFolder()
    const { data: folders } = useGetFolders(false)

    /*
     * Reordering is otherwise drag-only, which never fires on touch. `id_ordering` is the
     * folder's target slot in the unfiltered list — the same value the drop target sends — so
     * moving up means taking the previous slot and moving down means clearing the next one.
     */
    const index = folders?.findIndex((f) => f.id === folder.id) ?? -1
    const reorderableFolders = folders?.filter((f) => f.id !== DEFAULT_FOLDER_ID && !f.is_done && !f.is_trash) ?? []
    const canMoveUp = index > 0 && reorderableFolders[0]?.id !== folder.id
    const canMoveDown = index >= 0 && reorderableFolders[reorderableFolders.length - 1]?.id !== folder.id

    const items: GTMenuItem[] = [
        {
            label: 'Move up',
            icon: icons.arrow_up,
            disabled: !canMoveUp,
            onClick: () => modifyFolder({ id: folder.id, id_ordering: index - 1 }, folder.optimisticId),
        },
        {
            label: 'Move down',
            icon: icons.arrow_down,
            disabled: !canMoveDown,
            onClick: () => modifyFolder({ id: folder.id, id_ordering: index + 2 }, folder.optimisticId),
        },
        {
            label: 'Rename Folder',
            icon: icons.pencil,
            onClick: () => {
                setSectionBeingEdited(folder)
            },
        },
        {
            label: 'Delete Folder',
            textColor: 'red',
            icon: icons.trash,
            iconColor: 'red',
            onClick: () => {
                deleteFolder({ id: folder.id }, folder.optimisticId)
            },
        },
    ]
    return <GTContextMenu items={items} trigger={children} onOpenChange={emptyFunction} />
}

export default NavigationContextMenuWrapper
