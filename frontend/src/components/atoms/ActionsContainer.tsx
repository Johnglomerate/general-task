import styled from 'styled-components'
import { Dimensions, Spacing } from '../../styles'

const Container = styled.div`
    display: flex;
    margin-bottom: ${Spacing._8};

    ${Dimensions.mediaQuery.phone} {
        flex-wrap: wrap;
        gap: ${Spacing._8};
    }
`
const RightActions = styled.div`
    margin-left: auto;
    display: flex;

    ${Dimensions.mediaQuery.phone} {
        margin-left: 0;
        flex-wrap: wrap;
        gap: ${Spacing._4};
    }
`

interface ActionsContainerProps {
    leftActions?: React.ReactNode
    rightActions?: React.ReactNode
}
const ActionsContainer = ({ leftActions, rightActions }: ActionsContainerProps) => {
    return (
        <Container>
            {leftActions}
            <RightActions>{rightActions}</RightActions>
        </Container>
    )
}

export default ActionsContainer
