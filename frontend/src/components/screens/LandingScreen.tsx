import { Navigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import styled from 'styled-components'
import { AUTHORIZATION_COOKE, LOGIN_URL } from '../../constants'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import GTButton from '../atoms/buttons/GTButton'

const TRIAL_DAYS = 67
const PRODUCT_PRICE = '$2/month'

const Page = styled.main`
    min-height: 100vh;
    background: ${Colors.background.base};
    color: ${Colors.text.base};
`

const Header = styled.header`
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${Spacing._16};
    padding: ${Spacing._16} ${Spacing._24};
    border-bottom: ${Border.stroke.medium} solid ${Colors.background.border};
    background: rgba(253, 253, 253, 0.96);
    backdrop-filter: blur(12px);

    @media (max-width: 640px) {
        align-items: flex-start;
        flex-direction: column;
    }
`

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    color: ${Colors.text.title};
    ${Typography.title.large};
`

const Logo = styled.img`
    width: ${Spacing._32};
    height: ${Spacing._32};
`

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    flex-wrap: wrap;
`

const HeaderLink = styled.a`
    color: ${Colors.text.base};
    text-decoration: none;
    ${Typography.title.small};

    &:hover {
        color: ${Colors.text.title};
    }
`

const Hero = styled.section`
    position: relative;
    min-height: 72vh;
    display: flex;
    align-items: center;
    overflow: hidden;
    isolation: isolate;
`

const HeroImage = styled.img`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0.28;
    z-index: -2;
`

const HeroShade = styled.div`
    position: absolute;
    inset: 0;
    background: rgba(253, 253, 253, 0.88);
    z-index: -1;
`

const HeroContent = styled.div`
    width: min(100%, 1120px);
    margin: 0 auto;
    padding: ${Spacing._64} ${Spacing._24};
`

const HeroCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._24};
    max-width: 720px;
`

const Eyebrow = styled.div`
    width: fit-content;
    padding: ${Spacing._4} ${Spacing._8};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    background: ${Colors.background.white};
    color: ${Colors.text.muted};
    ${Typography.label.medium};
`

const Title = styled.h1`
    margin: 0;
    color: ${Colors.text.title};
    ${Typography.display.large};

    @media (max-width: 640px) {
        ${Typography.display.medium};
    }
`

const Subtitle = styled.p`
    max-width: 640px;
    margin: 0;
    color: ${Colors.text.base};
    ${Typography.headline.small};
`

const ButtonRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    flex-wrap: wrap;
`

const FinePrint = styled.p`
    margin: 0;
    color: ${Colors.text.muted};
    ${Typography.body.medium};
`

const Section = styled.section`
    border-top: ${Border.stroke.medium} solid ${Colors.background.border};
    background: ${Colors.background.white};
`

const SectionInner = styled.div`
    width: min(100%, 1120px);
    margin: 0 auto;
    padding: ${Spacing._64} ${Spacing._24};
`

const SectionHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    max-width: 720px;
    margin-bottom: ${Spacing._32};
`

const SectionTitle = styled.h2`
    margin: 0;
    color: ${Colors.text.title};
    ${Typography.headline.large};
`

const SectionText = styled.p`
    margin: 0;
    color: ${Colors.text.base};
    ${Typography.body.large};
`

const FeatureGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${Spacing._16};

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`

const Feature = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._12};
    padding: ${Spacing._16};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.medium};
    background: ${Colors.background.base};
`

const FeatureTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    margin: 0;
    color: ${Colors.text.title};
    ${Typography.title.medium};
`

const FeatureText = styled.p`
    margin: 0;
    color: ${Colors.text.base};
    ${Typography.body.medium};
`

const PricingBand = styled.section`
    background: ${Colors.text.title};
    color: ${Colors.text.white};
`

const PricingInner = styled.div`
    width: min(100%, 1120px);
    margin: 0 auto;
    padding: ${Spacing._48} ${Spacing._24};
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${Spacing._24};

    @media (max-width: 760px) {
        align-items: flex-start;
        flex-direction: column;
    }
`

const PricingCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`

const PricingTitle = styled.h2`
    margin: 0;
    color: ${Colors.text.white};
    ${Typography.headline.large};
`

const PricingText = styled.p`
    margin: 0;
    color: ${Colors.background.hover};
    ${Typography.body.large};
`

const Screenshot = styled.img`
    display: block;
    width: 100%;
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.l};
`

const Footer = styled.footer`
    display: flex;
    justify-content: space-between;
    gap: ${Spacing._16};
    flex-wrap: wrap;
    padding: ${Spacing._24};
    border-top: ${Border.stroke.medium} solid ${Colors.background.border};
    color: ${Colors.text.muted};
    ${Typography.body.small};
`

const FooterLinks = styled.div`
    display: flex;
    gap: ${Spacing._16};
`

interface LandingScreenProps {
    isSignUp?: boolean
}

const LandingScreen = ({ isSignUp = false }: LandingScreenProps) => {
    if (Cookies.get(AUTHORIZATION_COOKE)) return <Navigate to="/overview" replace />

    return (
        <Page>
            <Header>
                <Brand>
                    <Logo src={logos.generaltask_single_color} alt="" />
                    General Task
                </Brand>
                <HeaderActions>
                    <HeaderLink href="#features" target="_self">
                        Features
                    </HeaderLink>
                    <HeaderLink href="#pricing" target="_self">
                        Pricing
                    </HeaderLink>
                    <NoStyleAnchor href={LOGIN_URL} target="_self">
                        <GTButton styleType="primary" value={isSignUp ? 'Start free trial' : 'Sign in'} />
                    </NoStyleAnchor>
                </HeaderActions>
            </Header>

            <Hero>
                <HeroImage src="/images/nux-task-to-cal.png" alt="" />
                <HeroShade />
                <HeroContent>
                    <HeroCopy>
                        <Eyebrow>Personal productivity app</Eyebrow>
                        <Title>General Task</Title>
                        <Subtitle>
                            Plan tasks, meetings, and focus time in one place. Start with a {TRIAL_DAYS}-day free trial,
                            then keep going for {PRODUCT_PRICE}.
                        </Subtitle>
                        <ButtonRow>
                            <NoStyleAnchor href={LOGIN_URL} target="_self">
                                <GTButton
                                    styleType="primary"
                                    value="Start free trial"
                                    rightIcon={icons.arrow_right}
                                    rightIconColor="white"
                                />
                            </NoStyleAnchor>
                            <NoStyleAnchor href="#features" target="_self">
                                <GTButton styleType="secondary" value="See features" />
                            </NoStyleAnchor>
                        </ButtonRow>
                        <FinePrint>No card at signup. Stripe checkout appears after your trial if you continue.</FinePrint>
                    </HeroCopy>
                </HeroContent>
            </Hero>

            <Section id="features">
                <SectionInner>
                    <SectionHeader>
                        <SectionTitle>Built for daily planning</SectionTitle>
                        <SectionText>
                            General Task brings your work into a focused plan without making you rebuild your day in
                            another tool.
                        </SectionText>
                    </SectionHeader>
                    <FeatureGrid>
                        <Feature>
                            <FeatureTitle>
                                <Icon icon={icons.calendar_days} color="blue" />
                                Time block tasks
                            </FeatureTitle>
                            <FeatureText>
                                Drag tasks onto your calendar and protect time for what matters.
                            </FeatureText>
                        </Feature>
                        <Feature>
                            <FeatureTitle>
                                <Icon icon={icons.inbox} color="green" />
                                Gather work
                            </FeatureTitle>
                            <FeatureText>
                                See tasks, meetings, pull requests, issues, and Slack action items together.
                            </FeatureText>
                        </Feature>
                        <Feature>
                            <FeatureTitle>
                                <Icon icon={icons.timer} color="purple" />
                                Stay focused
                            </FeatureTitle>
                            <FeatureText>
                                Use Focus Mode to keep the current task or meeting in front of you.
                            </FeatureText>
                        </Feature>
                    </FeatureGrid>
                </SectionInner>
            </Section>

            <Section>
                <SectionInner>
                    <Screenshot src="/images/nux-focus-mode.png" alt="General Task Focus Mode" />
                </SectionInner>
            </Section>

            <PricingBand id="pricing">
                <PricingInner>
                    <PricingCopy>
                        <PricingTitle>{TRIAL_DAYS}-day free trial, then {PRODUCT_PRICE}</PricingTitle>
                        <PricingText>
                            General Task is a paid consumer productivity app for people planning real work.
                        </PricingText>
                    </PricingCopy>
                    <NoStyleAnchor href={LOGIN_URL} target="_self">
                        <GTButton
                            styleType="primary"
                            value="Start free trial"
                            rightIcon={icons.arrow_right}
                            rightIconColor="white"
                        />
                    </NoStyleAnchor>
                </PricingInner>
            </PricingBand>

            <Footer>
                <div>Johnglomerate Limited © 2026</div>
                <FooterLinks>
                    <a href="/privacy-policy" target="_self">
                        Privacy Policy
                    </a>
                    <a href="/terms-of-service" target="_self">
                        Terms of Service
                    </a>
                </FooterLinks>
            </Footer>
        </Page>
    )
}

export default LandingScreen
