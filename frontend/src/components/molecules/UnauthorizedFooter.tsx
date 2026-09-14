import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

const Footer = styled.div`
    position: sticky;
    bottom: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._8} ${Spacing._16};
    background-color: ${Colors.background.white};
    border-top: ${Border.stroke.medium} solid ${Colors.background.border};
    width: 100%;
    z-index: 1;
    box-sizing: border-box;
`
const FooderDiv = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._16};
`
const FooterText = styled.span`
    color: ${Colors.text.base};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    ${Typography.body.small};
`
const UnauthorizedFooter = () => {
    const navigate = useNavigate()
    return (
        <Footer>
            <FooderDiv>
                <Icon icon={logos.generaltask_single_color} size="large" />
                <FooterText>Johnglomerate Limited © 2026</FooterText>
            </FooderDiv>
            <FooderDiv>
                <NoStyleButton onClick={() => navigate('/privacy-policy')}>
                    <FooterText>Privacy Policy</FooterText>
                </NoStyleButton>
                <NoStyleButton onClick={() => navigate('/terms-of-service')}>
                    <FooterText>Terms of Service</FooterText>
                </NoStyleButton>
            </FooderDiv>
        </Footer>
    )
}

export default UnauthorizedFooter
