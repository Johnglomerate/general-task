import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'
import {
    AUTHORIZATION_COOKE,
    LOGIN_URL,
    PRIVACY_POLICY_ROUTE,
    TERMS_OF_SERVICE_ROUTE,
} from '../../constants'
import { logos } from '../../styles/images'

const ASSET_BASE = '/images/landing'
const assets = {
    background: `${ASSET_BASE}/general-task-background.png`,
    hero: `${ASSET_BASE}/general-task-front-illustration.png`,
}

// Marketing copy; keep aligned with TrialPeriodDays in backend/api/subscription.go.
const signupFinePrint = '67 day free trial. No card at signup.'
const landingDescription = 'Take control of your time with powerful daily planning software. Only $2/month.'

const Page = styled.main`
    min-width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    background: #f0f3f7;
    color: #222721;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    -webkit-font-smoothing: antialiased;
`

const Header = styled.header`
    position: sticky;
    top: 0;
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    background: #f0f3f7;
    backdrop-filter: blur(5px);
`

const Nav = styled.div`
    width: 100%;
    max-width: 1050px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;

    @media (max-width: 1100px) {
        padding: 16px 24px;
    }

    @media (max-width: 479px) {
        gap: 16px;
        align-items: flex-start;
        flex-direction: column;
    }
`

const Logo = styled.img`
    width: 32px;
    height: 32px;
    display: block;
`

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`

const BrandName = styled.div`
    color: #222721;
    font-size: 24px;
    font-weight: 700;
    line-height: 32px;
`

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;

    @media (max-width: 479px) {
        width: 100%;
        justify-content: space-between;
    }
`

const LoginLink = styled.a`
    color: #222721;
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
    text-decoration: none;

    &:hover {
        color: #515852;
    }
`

const CTA = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-height: 40px;
    padding: 10px 24px;
    border: 1px solid #222721;
    border-radius: 100px;
    background: #fbdd40;
    color: #222721;
    font-family: inherit;
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
    text-align: center;
    text-decoration: none;

    &:hover {
        background: #fad512;
    }
`

const LargeCTA = styled(CTA)`
    padding: 16px 40px;
    font-size: 24px;
    line-height: 28px;

    @media (max-width: 479px) {
        width: 100%;
        font-size: 20px;
    }
`

const PageWrapper = styled.div`
    position: relative;
    width: 100%;
    max-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`

const HeroArt = styled.img`
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 0;
    width: 100%;
    pointer-events: none;
`

const HeroBackground = styled.img`
    position: absolute;
    top: 0;
    right: 0;
    bottom: auto;
    left: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
`

const InnerBlock = styled.div`
    position: relative;
    z-index: 1;
    width: 1050px;
    max-width: 100%;
    align-self: center;
    background: #ffffff;
`

const Section = styled.section`
    position: relative;
    display: block;
    padding: 20px 0;
`

const HeroSection = styled(Section)`
    overflow: hidden;
    isolation: isolate;
    padding-top: 0;
`

const Container = styled.div`
    width: 100%;
    max-width: 1050px;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 0 20px;
`

const HeroContainer = styled(Container)`
    position: relative;
    z-index: 1;
    max-width: 960px;
    margin-top: 100px;
    margin-bottom: 100px;
    text-align: center;

    @media (max-width: 991px) {
        margin-bottom: 40px;
        padding-top: 40px;
        padding-bottom: 0;
    }
`

const HeroCopy = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`

const HeroTitle = styled.h1`
    max-width: 100%;
    margin: 0 0 20px;
    color: #222721;
    font-size: 80px;
    font-weight: 700;
    line-height: 85px;
    text-align: center;

    @media (max-width: 991px) {
        font-size: 70px;
        line-height: 70px;
    }

    @media (max-width: 479px) {
        font-size: 56px;
        line-height: 58px;
    }
`

const LargeText = styled.p`
    width: 830px;
    max-width: 100%;
    margin: 0;
    color: #222721;
    font-size: 28px;
    font-weight: 400;
    line-height: 38px;
    text-align: center;

    @media (max-width: 991px) {
        font-size: 18px;
        line-height: 28px;
    }

    @media (max-width: 479px) {
        font-size: 16px;
        line-height: 24px;
    }
`

const ButtonStack = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 32px;

    @media (max-width: 479px) {
        width: 100%;
        flex-direction: column;
    }
`

const FinePrint = styled.p`
    max-width: 600px;
    margin: 18px auto 0;
    color: rgba(34, 39, 33, 0.45);
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    text-align: center;
`

const Heading = styled.h2`
    margin: 0 0 16px;
    color: #222721;
    font-size: 40px;
    font-weight: 700;
    line-height: 116%;

    @media (max-width: 991px) {
        font-size: 36px;
        line-height: 36px;
    }

    @media (max-width: 479px) {
        font-size: 25px;
        line-height: 31px;
    }
`

const SplitContainer = styled(Container)`
    max-width: 960px;
`

const Split = styled.div<{ $reverseOnMobile?: boolean }>`
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 50px 16px;
    margin-top: 40px;

    @media (max-width: 991px) {
        display: flex;
        flex-direction: ${({ $reverseOnMobile }) => ($reverseOnMobile ? 'column-reverse' : 'column')};
    }
`

const FeatureText = styled.div`
    color: #222721;
    font-size: 20px;
    font-weight: 400;
    line-height: 28px;

    @media (max-width: 479px) {
        font-size: 14px;
        line-height: 24px;
    }
`

const FeaturePanel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    padding: 32px;
    border: 1px solid rgba(34, 39, 33, 0.12);
    border-radius: 8px;
    background:
        linear-gradient(135deg, rgba(251, 221, 64, 0.24), rgba(220, 236, 245, 0.78)),
        #ffffff;
    color: #222721;
    font-size: 28px;
    font-weight: 700;
    line-height: 34px;
    text-align: center;

    @media (max-width: 479px) {
        min-height: 180px;
        font-size: 22px;
        line-height: 28px;
    }
`

const FocusSection = styled(Section)`
    padding-bottom: 60px;
`

const FocusPanel = styled(FeaturePanel)`
    margin: 100px 0 40px;

    @media (max-width: 479px) {
        max-width: 90%;
        margin: 64px auto 20px;
    }
`

const BlueSection = styled.section`
    display: flex;
    justify-content: center;
    padding: 60px;
    background: #dcecf5;

    @media (max-width: 767px) {
        padding: 60px 20px;
    }
`

const SmallHeading = styled.h4`
    max-width: 500px;
    margin: 0 0 10px;
    color: #222721;
    font-size: 26px;
    font-weight: 700;
    line-height: 32px;

    @media (max-width: 479px) {
        font-size: 25px;
    }
`

const MutedCopy = styled.div`
    max-width: 100%;
    color: #222721;
    font-size: 20px;
    font-weight: 400;
    line-height: 28px;
    opacity: 0.78;

    @media (max-width: 479px) {
        font-size: 14px;
        line-height: 24px;
    }
`

const EndSection = styled(Section)`
    padding-top: 130px;
    padding-bottom: 220px;
`

const BottomCard = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    margin: 0 40px;
    padding: 40px 0;
    border-radius: 20px;
    background: #ffffff;
    text-align: center;
`

const BottomHeading = styled(HeroTitle)`
    max-width: 960px;
    margin-bottom: 30px;
    font-size: 56px;
    line-height: 56px;

    @media (max-width: 479px) {
        font-size: 40px;
        line-height: 44px;
    }
`

const BottomText = styled.p`
    width: 90%;
    max-width: 550px;
    margin: 0 0 40px;
    color: #000000;
    font-size: 20px;
    font-weight: 400;
    line-height: 28px;
    text-align: center;
`

const Footer = styled.footer`
    width: 100%;
    padding-top: 40px;
    border-top: 2px solid #000000;
    background: #ffffff;
`

const FooterInner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    max-width: 1050px;
    margin: 0 auto;
    padding: 0 20px 40px;

    @media (max-width: 479px) {
        align-items: flex-start;
        flex-direction: column;
    }
`

const FooterName = styled.div`
    color: #222721;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
`

const FooterLinks = styled.div`
    display: flex;
    gap: 24px;

    a {
        color: #222721;
        font-size: 14px;
        text-decoration: none;
    }
`

const LandingScreen = () => {
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />

    return (
        <Page>
            <Helmet>
                <title>General Task - Personal productivity for $2/month</title>
                <meta content={landingDescription} name="description" />
                <meta content="General Task - Personal productivity for $2/month" property="og:title" />
                <meta content={landingDescription} property="og:description" />
                <meta content="General Task - Personal productivity for $2/month" property="twitter:title" />
                <meta content={landingDescription} property="twitter:description" />
                <meta property="og:image" content="/images/landing/general-task-background.png" />
            </Helmet>
            <Header>
                <Nav>
                    <Brand>
                        <Logo src={logos.generaltask_blue_circle} alt="" />
                        <BrandName>General Task</BrandName>
                    </Brand>
                    <HeaderActions>
                        <LoginLink href={LOGIN_URL} target="_self">
                            Log in
                        </LoginLink>
                        <CTA href={LOGIN_URL} target="_self">
                            Start free trial
                        </CTA>
                    </HeaderActions>
                </Nav>
            </Header>

            <PageWrapper>
                <InnerBlock>
                    <HeroSection>
                        <HeroBackground src={assets.background} alt="" />
                        <HeroArt src={assets.hero} alt="" />
                        <HeroContainer>
                            <HeroCopy>
                                <HeroTitle>Effortless time blocking.</HeroTitle>
                                <LargeText>{landingDescription}</LargeText>
                                <ButtonStack>
                                    <LargeCTA href={LOGIN_URL} target="_self">
                                        Start free trial
                                    </LargeCTA>
                                </ButtonStack>
                                <FinePrint>{signupFinePrint}</FinePrint>
                            </HeroCopy>
                        </HeroContainer>
                    </HeroSection>

                    <Section>
                        <SplitContainer>
                            <Split>
                                <div>
                                    <Heading>Set time aside for what you need to do.</Heading>
                                    <FeatureText>
                                        Drag any task to your calendar, and an event will be created on your Google Calendar.
                                    </FeatureText>
                                </div>
                                <FeaturePanel>Task to calendar</FeaturePanel>
                            </Split>
                        </SplitContainer>
                    </Section>

                    <Section>
                        <SplitContainer>
                            <Split $reverseOnMobile>
                                <FeaturePanel>All your work in one place</FeaturePanel>
                                <div>
                                    <Heading>All your most important tasks at a glance.</Heading>
                                    <FeatureText>
                                        Our integrations stay in sync with all of your actionable items: PRs from{' '}
                                        <strong>GitHub</strong>, tasks from <strong>Linear</strong> and <strong>Jira</strong>,
                                        meetings from <strong>Google Calendar</strong>, and even <strong>Slack</strong>{' '}
                                        messages.
                                    </FeatureText>
                                </div>
                            </Split>
                        </SplitContainer>
                    </Section>

                    <FocusSection>
                        <SplitContainer>
                            <FocusPanel>Focus mode</FocusPanel>
                            <div>
                                <Heading>
                                    Forget multitasking - this is <em>singletasking</em>.
                                </Heading>
                                <FeatureText>
                                    A single distraction can take up to <strong>23 minutes</strong> to fully recover from.
                                    With Focus Mode, you can devote all your attention to one task or topic at a time.
                                </FeatureText>
                            </div>
                        </SplitContainer>
                    </FocusSection>

                    <BlueSection>
                        <Container>
                            <SmallHeading>An ergonomic tool for daily use.</SmallHeading>
                            <MutedCopy>
                                Software should help you, not get in your way.
                                <br />
                                <br />
                                We strongly believe that the interfaces we use each day should be as efficient and comfortable
                                as possible.
                                <br />
                                <br />A great example is Quick Command, which lets you take shortcuts with a few simple
                                keystrokes.
                            </MutedCopy>
                        </Container>
                    </BlueSection>

                    <EndSection id="pricing">
                        <BottomCard>
                            <BottomHeading>Get started below.</BottomHeading>
                            <BottomText>
                                General Task is a paid consumer productivity app. Only $2/month.
                            </BottomText>
                            <LargeCTA href={LOGIN_URL} target="_self">
                                Start free trial
                            </LargeCTA>
                            <FinePrint>{signupFinePrint}</FinePrint>
                        </BottomCard>
                    </EndSection>
                </InnerBlock>
            </PageWrapper>

            <Footer>
                <FooterInner>
                    <FooterName>2026 GENERAL TASK</FooterName>
                    <FooterLinks>
                        <a href={`/${PRIVACY_POLICY_ROUTE}`} target="_self">
                            Privacy Policy
                        </a>
                        <a href={`/${TERMS_OF_SERVICE_ROUTE}`} target="_self">
                            Terms of Service
                        </a>
                    </FooterLinks>
                </FooterInner>
            </Footer>
        </Page>
    )
}

export default LandingScreen
