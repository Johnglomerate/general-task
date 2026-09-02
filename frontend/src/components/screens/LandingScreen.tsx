import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import styled from 'styled-components'
import {
    AUTHORIZATION_COOKE,
    LOGIN_URL,
    PRIVACY_POLICY_ROUTE,
    SUBSCRIPTION_PRICE,
    SUBSCRIPTION_TRIAL_DAYS,
    TERMS_OF_SERVICE_ROUTE,
} from '../../constants'
import { logos } from '../../styles/images'

const ASSET_BASE = 'https://cdn.prod.website-files.com/63409b717d871ecb319db373'
const assets = {
    background: `${ASSET_BASE}/636af9bbbe698027558a1947_general-task-background.png`,
    hero: `${ASSET_BASE}/636afd8e514fce06043f4d79_general-task-front-illustration.png`,
    videoPoster: `${ASSET_BASE}/636c1ffdc38dd14be4d02d4c_frontpage-edited-poster-00001.jpg`,
    videoMp4: `${ASSET_BASE}/636c1ffdc38dd14be4d02d4c_frontpage-edited-transcode.mp4`,
    videoWebm: `${ASSET_BASE}/636c1ffdc38dd14be4d02d4c_frontpage-edited-transcode.webm`,
    taskToCalendar: `${ASSET_BASE}/636c46a4bfd4d8882564e934_Group%20619.png`,
    integrations: `${ASSET_BASE}/63409b717d871e76fd9db413_Group%20569.png`,
    focusMode: `${ASSET_BASE}/636c5c117d4307fa7039347d_fm-recolor2.png`,
}

const customerLogos = [
    {
        alt: 'Nvidia',
        src: `${ASSET_BASE}/63c4616694eb3965f10157b9_-UIB2q__nvidia-wordmark%201%20(1).png`,
    },
    { alt: 'HubSpot', src: `${ASSET_BASE}/63c461809bcbb4b9038ca350_hubspot-ar21%201.png` },
    { alt: 'Salesforce', src: `${ASSET_BASE}/63c461a41c2178afe6ca8dd2_salesforce-ar21%201.png` },
    { alt: 'Qantas', src: `${ASSET_BASE}/63c461c7ce5aa246e3df521f_qantas-vector-logo%201.png` },
    { alt: 'Square', src: `${ASSET_BASE}/63c461e53b2b760509b1b928_Square_LogoLockup_Black%201.png` },
    { alt: 'Grammarly', src: `${ASSET_BASE}/63c46200ee0d0fa18fbca8a3_Grammarly_logo%201.png` },
    { alt: 'Zendesk', src: `${ASSET_BASE}/63c46229a9b6a013df778250_5cac62bcf8d44d3bf418da1a_wordmark%201.png` },
    {
        alt: 'Philippine Space Agency',
        src: `${ASSET_BASE}/63c462b47204b6d5115a6054_philsa-banner%201%20(1).png`,
    },
]

const trialOffer = `${SUBSCRIPTION_TRIAL_DAYS}-day free trial, then ${SUBSCRIPTION_PRICE}`

const Page = styled.main`
    min-width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    background: #f0f3f7;
    color: #222721;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
    width: 150px;
    max-width: 38vw;
    display: block;
`

const CTA = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 10px 24px;
    border: 1px solid #222721;
    border-radius: 100px;
    background: #fbdd40;
    color: #222721;
    font-size: 16px;
    font-weight: 700;
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
    z-index: 40000;
    width: 100%;
    pointer-events: none;
`

const HeroBackground = styled.img`
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
    width: 100%;
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
    padding-top: 0;
`

const Container = styled.div`
    width: 100%;
    max-width: 1050px;
    margin: 0 auto;
    padding: 0 20px;
`

const HeroContainer = styled(Container)`
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
    color: #515852;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    text-align: center;
`

const VideoContainer = styled(Container)`
    max-width: 1050px;
    padding: 0;
    display: flex;
    justify-content: center;
`

const ProductVideo = styled.video`
    position: relative;
    z-index: 500000;
    width: 955px;
    max-width: 100%;
    height: 540px;
    display: block;
    object-fit: cover;
    border-radius: 9px;
    box-shadow:
        0 1px 1px rgba(0, 0, 0, 0.03),
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 3px 3.5px rgba(0, 0, 0, 0.06),
        0 5px 6.5px rgba(0, 0, 0, 0.07),
        0 7px 12.12px rgba(0, 0, 0, 0.08),
        0 12px 29px rgba(0, 0, 0, 0.11);

    @media (max-width: 767px) {
        height: 250px;
    }
`

const LogoSection = styled(Section)`
    padding-top: 40px;
`

const LogoContainer = styled(Container)`
    max-width: 960px;
    text-align: center;
`

const LogoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
    justify-items: center;
    gap: 24px 16px;
    padding: 40px 80px;

    @media (max-width: 767px) {
        grid-template-columns: repeat(2, 1fr);
        padding: 32px 20px;
    }
`

const CustomerLogo = styled.img`
    max-width: 100%;
    padding: 0 20px;
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

const LogoHeading = styled(Heading)`
    text-align: center;
`

const Divider = styled.div`
    width: 80%;
    height: 1px;
    margin: 100px auto 0;
    background: #b6b6b6;
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

const FeatureImage = styled.img`
    width: 100%;
    display: block;
`

const IntegrationsImage = styled(FeatureImage)`
    width: 450px;
    max-width: 100%;
    margin: 20px 0;
`

const FocusSection = styled(Section)`
    padding-bottom: 60px;
`

const FocusImage = styled.img`
    width: 100%;
    display: block;
    margin: 100px 0 40px;
    border-radius: 8px;
    box-shadow: 0 4px 10px -2px gray;

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
            <Header>
                <Nav>
                    <Logo src={logos.generaltask_beta_blue} alt="General Task" />
                    <CTA href={LOGIN_URL} target="_self">
                        Start free trial
                    </CTA>
                </Nav>
            </Header>

            <PageWrapper>
                <HeroArt src={assets.hero} alt="" />
                <HeroBackground src={assets.background} alt="" />
                <InnerBlock>
                    <HeroSection>
                        <HeroContainer>
                            <HeroCopy>
                                <HeroTitle>Effortless time blocking.</HeroTitle>
                                <LargeText>
                                    Take control of your time with powerful daily planning software. Start with a{' '}
                                    {trialOffer}.
                                </LargeText>
                                <ButtonStack>
                                    <LargeCTA href={LOGIN_URL} target="_self">
                                        Start free trial
                                    </LargeCTA>
                                </ButtonStack>
                                <FinePrint>No card at signup. Stripe checkout appears after your trial if you continue.</FinePrint>
                            </HeroCopy>
                        </HeroContainer>
                        <VideoContainer>
                            <ProductVideo
                                autoPlay
                                loop
                                muted
                                playsInline
                                poster={assets.videoPoster}
                                aria-label="General Task product walkthrough"
                            >
                                <source src={assets.videoMp4} type="video/mp4" />
                                <source src={assets.videoWebm} type="video/webm" />
                            </ProductVideo>
                        </VideoContainer>
                    </HeroSection>

                    <LogoSection>
                        <LogoContainer>
                            <LogoGrid>
                                {customerLogos.map((logo) => (
                                    <CustomerLogo key={logo.alt} src={logo.src} alt={logo.alt} />
                                ))}
                            </LogoGrid>
                            <LogoHeading>Used by the best teams.</LogoHeading>
                            <Divider />
                        </LogoContainer>
                    </LogoSection>

                    <Section>
                        <SplitContainer>
                            <Split>
                                <div>
                                    <Heading>Set time aside for what you need to do.</Heading>
                                    <FeatureText>
                                        Drag any task to your calendar, and an event will be created on your Google Calendar.
                                    </FeatureText>
                                </div>
                                <FeatureImage src={assets.taskToCalendar} alt="Task to Calendar" />
                            </Split>
                        </SplitContainer>
                    </Section>

                    <Section>
                        <SplitContainer>
                            <Split $reverseOnMobile>
                                <IntegrationsImage src={assets.integrations} alt="Integrations" />
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
                            <FocusImage src={assets.focusMode} alt="Focus Mode" />
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
                            <BottomText>General Task is a paid consumer productivity app. Start with a {trialOffer}.</BottomText>
                            <LargeCTA href={LOGIN_URL} target="_self">
                                Start free trial
                            </LargeCTA>
                            <FinePrint>No card at signup. Stripe checkout appears after your trial if you continue.</FinePrint>
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
