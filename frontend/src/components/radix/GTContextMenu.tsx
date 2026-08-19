import { Fragment } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import styled from 'styled-components'
import { OVERLAY_COLLISION_PADDING } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import {
    FixedSizeIcon,
    GTMenuItem,
    MarginLeftIcon,
    MenuContentShared,
    MenuItemLabel,
    MenuItemShared,
} from './RadixUIConstants'
import Tip from './Tip'

const ContextMenuTrigger = styled(ContextMenu.Trigger)`
    all: unset;
`
// Submenus hold folder lists and a whole date picker, so both levels need to scroll rather than
// run off the bottom of a phone screen.
const CONTEXT_MENU_MAX_HEIGHT = '75vh'
const ContextMenuContent = styled(ContextMenu.Content)`
    ${MenuContentShared};
    max-height: ${CONTEXT_MENU_MAX_HEIGHT};
    overflow: auto;
`
const ContextMenuSubContent = styled(ContextMenu.SubContent)`
    ${MenuContentShared};
    max-height: ${CONTEXT_MENU_MAX_HEIGHT};
    overflow: auto;
`
const ContextMenuItem = styled(ContextMenu.Item)`
    ${MenuItemShared};
`
const ContextMenuSubTrigger = styled(ContextMenu.SubTrigger)`
    ${MenuItemShared};
`
const FullWidth = styled.div`
    width: 100%;
`

interface GTContextMenuProps {
    items: GTMenuItem[]
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    onOpenChange: (open: boolean) => void
}
const GTContextMenu = ({ items, trigger, onOpenChange }: GTContextMenuProps) => {
    return (
        <FullWidth>
            <ContextMenu.Root onOpenChange={onOpenChange} modal={false}>
                <ContextMenuTrigger>{trigger}</ContextMenuTrigger>
                <ContextMenu.Portal>
                    <ContextMenuContent
                        onKeyDown={(e) => stopKeydownPropogation(e, ['Escape'], true)}
                        collisionPadding={OVERLAY_COLLISION_PADDING}
                    >
                        {items.map((item) => (
                            <Fragment key={item.label}>
                                {item.subItems ? (
                                    <ContextMenu.Sub>
                                        <Tip key={item.label} content={item.tip} side="right">
                                            <ContextMenuSubTrigger
                                                onSelect={item.onClick}
                                                $textColor={item.textColor}
                                                disabled={item.disabled}
                                                $disabled={item.disabled}
                                            >
                                                {item.icon && <Icon icon={item.icon} color={item.iconColor} />}
                                                <MenuItemLabel>{item.label}</MenuItemLabel>
                                                <MarginLeftIcon>
                                                    <Icon icon={icons.caret_right} />
                                                </MarginLeftIcon>
                                            </ContextMenuSubTrigger>
                                        </Tip>
                                        <ContextMenu.Portal>
                                            <ContextMenuSubContent collisionPadding={OVERLAY_COLLISION_PADDING}>
                                                {item.subItems.map((subItem) =>
                                                    subItem.renderer ? (
                                                        <Fragment key={subItem.label}>{subItem.renderer()}</Fragment>
                                                    ) : (
                                                        <Tip key={subItem.label} content={item.tip} side="right">
                                                            <ContextMenuItem
                                                                textValue={subItem.label}
                                                                onSelect={subItem.onClick}
                                                                $disabled={subItem.disabled}
                                                                disabled={item.disabled}
                                                            >
                                                                <FixedSizeIcon visible={subItem.selected}>
                                                                    <Icon icon={icons.check} />
                                                                </FixedSizeIcon>
                                                                {subItem.icon && (
                                                                    <Icon
                                                                        icon={subItem.icon}
                                                                        color={subItem.iconColor}
                                                                    />
                                                                )}
                                                                <MenuItemLabel>{subItem.label}</MenuItemLabel>
                                                            </ContextMenuItem>
                                                        </Tip>
                                                    )
                                                )}
                                            </ContextMenuSubContent>
                                        </ContextMenu.Portal>
                                    </ContextMenu.Sub>
                                ) : (
                                    <Tip key={item.label} content={item.tip} side="right">
                                        <ContextMenuItem
                                            textValue={item.label}
                                            onSelect={item.onClick}
                                            $textColor={item.textColor}
                                            $disabled={item.disabled}
                                            disabled={item.disabled}
                                        >
                                            {item.icon && <Icon icon={item.icon} color={item.iconColor} />}
                                            {item.label}
                                            {item.selected && (
                                                <MarginLeftIcon>
                                                    <Icon icon={icons.check} />
                                                </MarginLeftIcon>
                                            )}
                                        </ContextMenuItem>
                                    </Tip>
                                )}
                            </Fragment>
                        ))}
                    </ContextMenuContent>
                </ContextMenu.Portal>
            </ContextMenu.Root>
        </FullWidth>
    )
}

export default GTContextMenu
