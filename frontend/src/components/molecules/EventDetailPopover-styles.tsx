import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { OVERLAY_MAX_WIDTH } from '../../styles/dimensions'
import NoStyleAnchor from '../atoms/NoStyleAnchor'

const MAX_POPUP_LENGTH = 315
const MAX_POPUP_HEIGHT = 500

export const EventBoxStyle = styled.div`
    box-sizing: border-box;
    padding: ${Spacing._16} ${Spacing._16};
    width: min(${MAX_POPUP_LENGTH}px, ${OVERLAY_MAX_WIDTH});
    /* Never exceed the popover's own content box, whatever padding it carries. */
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
export const EventHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${Spacing._8};
`
export const EventTitle = styled.span`
    color: ${Colors.text.black};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    ${Typography.body.medium};
`
export const Description = styled.div`
    ${Typography.body.small};
    color: ${Colors.text.black};
    overflow-wrap: break-word;
    overflow-y: auto;
    /* The description must not eat the whole screen — the buttons below it are the point. */
    max-height: min(${MAX_POPUP_HEIGHT}px, 40dvh);
    margin-bottom: ${Spacing._16};
    white-space: pre-wrap;
`
export const FlexAnchor = styled(NoStyleAnchor)`
    flex: 1;
`
