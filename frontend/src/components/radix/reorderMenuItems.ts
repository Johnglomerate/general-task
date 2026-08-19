import { icons } from '../../styles/images'
import { GTMenuItem } from './RadixUIConstants'

export interface ReorderActions {
    // absent at the ends of the list, where the item cannot move any further
    moveUp?: () => void
    moveDown?: () => void
}

/*
 * Manual reordering is drag-only everywhere it appears, and drag never fires on touch. These
 * items give every reorderable list the same tap- and keyboard-reachable pair.
 */
const getReorderMenuItems = ({ moveUp, moveDown }: ReorderActions): GTMenuItem[] => [
    {
        label: 'Move up',
        icon: icons.arrow_up,
        disabled: !moveUp,
        onClick: moveUp,
    },
    {
        label: 'Move down',
        icon: icons.arrow_down,
        disabled: !moveDown,
        onClick: moveDown,
    },
]

export default getReorderMenuItems
