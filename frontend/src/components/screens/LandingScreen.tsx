import { Helmet } from 'react-helmet'
import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { AUTHORIZATION_COOKE } from '../../constants'
import LandingPage from '../landing/LandingPage'

const LandingScreen = () => {
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />

    return (
        <>
            <Helmet>
                <title>General Task — Where your short-term tasks meet your long-term goals.</title>
                <meta
                    name="description"
                    content="General Task uses AI to break down your big goals into actionable, shorter-term actions, and helps you keep track of your progress."
                />
            </Helmet>
            <LandingPage />
        </>
    )
}

export default LandingScreen
