import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import styled, { css } from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../constants/shortcuts'
import useCanHover from '../../hooks/useCanHover'
import { Colors, Spacing, Typography } from '../../styles'
import { OVERLAY_COLLISION_PADDING, OVERLAY_MAX_WIDTH, TOOLTIP_MAX_WIDTH } from '../../styles/dimensions'
import Flex from '../atoms/Flex'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { MenuContentShared } from './RadixUIConstants'

const TooltipArrow = styled(Tooltip.Arrow)`
    visibility: visible;
    fill: ${Colors.background.white};
`

const TooltipContent = styled(Tooltip.Content)`
    ${MenuContentShared};
    padding: ${Spacing._8} ${Spacing._12};
    ${Typography.body.medium};
    /* Without a cap a long tip renders as one unbroken line, which on a phone is wider than the
       screen and gets pushed off by collision handling instead of wrapping. */
    max-width: min(${TOOLTIP_MAX_WIDTH}, calc(${OVERLAY_MAX_WIDTH} - ${Spacing._12} * 2));
    overflow-wrap: break-word;
`
const TriggerSpan = styled.span<{ fitContent?: boolean }>`
    ${(props) =>
        props.fitContent &&
        css`
            width: fit-content;
            display: block;
        `}
`

export type TTooltipSide = 'top' | 'right' | 'bottom' | 'left'
export type TTooltipAlign = 'start' | 'center' | 'end'

interface TooltipProps {
    content?: React.ReactNode
    shortcutName?: TShortcutName
    overrideShortcutLabel?: string
    overrideShortcut?: string
    side?: TTooltipSide
    align?: TTooltipAlign
    children?: React.ReactNode
    disabled?: boolean
    fitContent?: boolean
}
const Tip = ({
    content,
    shortcutName,
    overrideShortcutLabel,
    overrideShortcut,
    side = 'bottom',
    align,
    children,
    disabled,
    fitContent = false,
}: TooltipProps) => {
    // A tooltip is a hover affordance, so on touch it is either unreachable or an accident — the
    // residue of a tap, which is how the sidebar's "New note" tip appeared on every open. Shortcut
    // hints are doubly moot there, with no keyboard to press them on. Render the child bare instead.
    const canHover = useCanHover()

    if (disabled || !canHover || (!content && !shortcutName)) return <>{children}</>

    const shortcutLabel = overrideShortcutLabel ?? (shortcutName ? KEYBOARD_SHORTCUTS[shortcutName].label : null)
    const shortcut = overrideShortcut ?? (shortcutName ? KEYBOARD_SHORTCUTS[shortcutName].keyLabel : null)

    const tooltipContent =
        shortcutLabel || shortcut ? (
            <Flex alignItems="center" justifyContent="center" gap={Spacing._8}>
                {shortcutLabel}
                <KeyboardShortcutContainer>{shortcut}</KeyboardShortcutContainer>
            </Flex>
        ) : (
            content
        )

    return (
        <Tooltip.Provider delayDuration={250} skipDelayDuration={1000} disableHoverableContent>
            <Tooltip.Root defaultOpen={false}>
                <Tooltip.Trigger asChild>
                    <TriggerSpan fitContent={fitContent}>{children}</TriggerSpan>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <TooltipContent
                        side={side}
                        sideOffset={5}
                        align={align}
                        arrowPadding={10}
                        collisionPadding={OVERLAY_COLLISION_PADDING}
                    >
                        {tooltipContent}
                        <TooltipArrow />
                    </TooltipContent>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export default Tip
