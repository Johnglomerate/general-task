import * as Popover from '@radix-ui/react-popover'
import styled from 'styled-components'
import { OVERLAY_COLLISION_PADDING, OVERLAY_MAX_HEIGHT } from '../../styles/dimensions'
import { MenuContentShared } from './RadixUIConstants'

const PopoverContent = styled(Popover.Content)`
    ${MenuContentShared};
    width: unset;
    /* Tall popovers scroll instead of running off a short viewport. */
    max-height: ${OVERLAY_MAX_HEIGHT};
    overflow: auto;
`

interface GTPopoverProps {
    content: React.ReactNode
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    isOpen?: boolean
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'right' | 'bottom' | 'left'
    disabled?: boolean
}
const GTPopover = ({ trigger, content, isOpen, setIsOpen, disabled, align = 'center', side }: GTPopoverProps) => {
    return (
        <Popover.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger disabled={disabled} asChild>
                {trigger}
            </Popover.Trigger>
            {content && (
                <Popover.Portal>
                    <PopoverContent
                        align={align}
                        side={side}
                        sideOffset={side ? 8 : 0}
                        sticky="always"
                        collisionPadding={OVERLAY_COLLISION_PADDING}
                    >
                        {content}
                    </PopoverContent>
                </Popover.Portal>
            )}
        </Popover.Root>
    )
}

export default GTPopover
