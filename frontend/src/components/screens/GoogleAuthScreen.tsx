import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { LOGIN_URL } from '../../constants'
import { Spacing } from '../../styles'
import { GoogleSignInButtonImage } from '../atoms/buttons/GoogleSignInButton'

const Container = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
    padding: ${Spacing._16};
`
const Link = styled.a`
    width: 200px;
    max-width: 100%;
`

const GoogleAuthScreen = () => {
    const [searchParams] = useSearchParams()
    const authUrl = searchParams.get('authUrl') ?? LOGIN_URL

    return (
        <Container>
            <Link href={authUrl} target="_self">
                {GoogleSignInButtonImage}
            </Link>
        </Container>
    )
}

export default GoogleAuthScreen
