import { useRef } from 'react'
import styled from 'styled-components'
import useDetailsViewDrop from '../../hooks/useDetailsViewDrop'
import { Colors, Dimensions, Spacing } from '../../styles'

const DetailsViewContainer = styled.div.attrs({ 'data-mobile-pane': 'detail' })`
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.base};
    min-width: 300px;
    padding: ${Spacing._32} ${Spacing._16} ${Spacing._16};
    gap: ${Spacing._8};
    overflow: auto;

    ${Dimensions.mediaQuery.phone} {
        min-width: 0;
        width: 100%;
        padding: ${Spacing._16} ${Spacing._12};
        box-sizing: border-box;
    }
`

const DetailsViewTemplate = ({ children }: { children: React.ReactNode }) => {
    const detailsViewContainerRef = useRef<HTMLDivElement>(null)
    useDetailsViewDrop(detailsViewContainerRef)

    return <DetailsViewContainer ref={detailsViewContainerRef}>{children}</DetailsViewContainer>
}

export default DetailsViewTemplate
