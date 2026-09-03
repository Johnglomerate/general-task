import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE, LOGIN_URL } from '../../constants'
import { Spacing } from '../../styles'
import apiClient from '../../utils/api'
import GTButton from '../atoms/buttons/GTButton'
import { GoogleSignInButtonImage } from '../atoms/buttons/GoogleSignInButton'
import Flex from '../atoms/Flex'
import GTInput from '../atoms/GTInput'
import { BodySmall } from '../atoms/typography/Typography'

const Container = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
    padding: ${Spacing._16};
`
const Panel = styled(Flex)`
    width: 280px;
    max-width: 100%;
`
const GoogleLink = styled.a`
    width: 100%;
    max-width: 100%;
    display: flex;
    justify-content: center;
`
const GoogleImage = styled.div`
    width: 200px;
    max-width: 100%;
`

type TLinkStatus = 'idle' | 'sending' | 'sent' | 'error'

const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<TLinkStatus>('idle')

    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (!email || status === 'sending') return
        setStatus('sending')
        try {
            await apiClient.post('/login/email/', { email })
            setStatus('sent')
        } catch {
            setStatus('error')
        }
    }

    const statusMessage = status === 'sent' ? 'Check your email' : status === 'error' ? 'Could not send link' : ''

    return (
        <Container>
            <Panel column alignItems="center" gap={Spacing._16}>
                <GoogleLink href={LOGIN_URL} target="_self">
                    <GoogleImage>{GoogleSignInButtonImage}</GoogleImage>
                </GoogleLink>
                <BodySmall color="muted">or</BodySmall>
                <form onSubmit={onSubmit} style={{ width: '100%' }}>
                    <Flex column gap={Spacing._8}>
                        <GTInput
                            type="email"
                            autoComplete="email"
                            placeholder="Email"
                            value={email}
                            onChange={(value) => {
                                setEmail(value)
                                if (status === 'error' || status === 'sent') setStatus('idle')
                            }}
                        />
                        <GTButton
                            styleType="primary"
                            value={status === 'sending' ? 'Sending' : 'Send login link'}
                            type="submit"
                            disabled={!email || status === 'sending'}
                            fitContent={false}
                        />
                        {statusMessage && <BodySmall color="muted">{statusMessage}</BodySmall>}
                    </Flex>
                </form>
            </Panel>
        </Container>
    )
}

export default LoginScreen
