import { Helmet } from 'react-helmet'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { BodyMedium, TitleLarge } from '../atoms/typography/Typography'

const Container = styled.main`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${Spacing._8};
    padding: ${Spacing._24};
    text-align: center;
`

const SharedTaskUnavailableView = () => (
    <Container>
        <Helmet>
            <title>Shared task unavailable</title>
            <meta content="Shared task unavailable" property="og:title" />
            <meta content="Shared tasks are no longer available." property="og:description" />
        </Helmet>
        <TitleLarge>Shared task unavailable</TitleLarge>
        <BodyMedium color="light">Shared tasks are no longer available.</BodyMedium>
    </Container>
)

export default SharedTaskUnavailableView
