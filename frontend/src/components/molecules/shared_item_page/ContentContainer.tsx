import styled from 'styled-components'
import { SHARED_ITEM_WIDTH } from '../../../styles/dimensions'

const ContentContainer = styled.div`
    position: relative;
    box-sizing: border-box;
    /* min-height, not height, so a long note grows the page instead of spilling out of a fixed box. */
    min-height: 100vh;
    width: 100%;
    max-width: ${SHARED_ITEM_WIDTH};
`

export default ContentContainer
