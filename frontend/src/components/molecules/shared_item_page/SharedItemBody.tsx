import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'
import { mediaQuery } from '../../../styles/dimensions'
import { Divider } from '../../atoms/SectionDivider'

const SharedItemBody = styled.div`
    background: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.deprecated_medium};
    gap: ${Spacing._16};
    margin: ${Spacing._24};
    /* Long words and unbroken URLs would otherwise widen the card past the viewport. */
    overflow-wrap: break-word;
    ${mediaQuery.phone} {
        margin: ${Spacing._16};
    }
`

const PaddedContainerContent = styled.div`
    padding: ${Spacing._24};
    ${mediaQuery.phone} {
        padding: ${Spacing._16};
    }
`
const PaddedContainerFooter = styled.div`
    padding: ${Spacing._16} ${Spacing._24};
    ${mediaQuery.phone} {
        padding: ${Spacing._16};
    }
`

interface SharedItemBodyContainerProps {
    content: React.ReactNode
    footer?: React.ReactNode
}

const SharedItemBodyContainer = ({ content, footer }: SharedItemBodyContainerProps) => {
    return (
        <SharedItemBody>
            <PaddedContainerContent>{content}</PaddedContainerContent>
            {footer && (
                <>
                    <Divider />
                    <PaddedContainerFooter>{footer}</PaddedContainerFooter>
                </>
            )}
        </SharedItemBody>
    )
}

export default SharedItemBodyContainer
