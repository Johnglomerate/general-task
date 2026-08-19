import styled from 'styled-components'
import { Colors, Dimensions, Spacing } from '../../styles'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'

const ScrollableListTemplate = styled.div`
    padding: ${Spacing._32} ${Spacing._16} 100px;
    overflow-y: auto;
    width: ${DEFAULT_VIEW_WIDTH};
    background-color: ${Colors.background.base};
    border-right: 1px solid ${Colors.background.border};

    ${Dimensions.mediaQuery.phone} {
        width: 100%;
        min-width: 0;
        padding: ${Spacing._16} ${Spacing._12} 96px;
        border-right: 0;
        box-sizing: border-box;
    }
`

export default ScrollableListTemplate
