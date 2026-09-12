import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { CompanyPolicyPages } from '../../utils/enums'
import { PrivacyPolicy, TermsOfService } from '../atoms/CompanyPoliciesHTML'
import { Icon } from '../atoms/Icon'
import { HeadlineLarge } from '../atoms/typography/Typography'
import UnauthorizedFooter from '../molecules/UnauthorizedFooter'
import UnauthorizedHeader from '../molecules/UnauthorizedHeader'

const CompanyPolicyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const Body = styled.div`
    max-width: 800px;
    margin: ${Spacing._32} 0px;
`
const PolicyContent = styled.div`
    a,
    a:visited {
        color: ${Colors.semantic.blue.base};
    }
`
const PolicyHeader = styled.div`
    display: flex;
    gap: ${Spacing._8};
    margin-bottom: ${Spacing._24};
    align-items: center;
`

interface CompanyPolicyViewProps {
    page: CompanyPolicyPages
}
const CompanyPolicyView = ({ page }: CompanyPolicyViewProps) => {
    const [pageTitle, pageContent] =
        page === CompanyPolicyPages.TermsOfService
            ? ['General Task Terms of Service', <TermsOfService key="tos" />]
            : ['General Task Privacy Policy', <PrivacyPolicy key="pp" />]
    return (
        <CompanyPolicyContainer>
            <UnauthorizedHeader />
            <Body>
                <PolicyHeader>
                    <Icon size="large" icon={icons.check_circle_wavy} color="black" />
                    <HeadlineLarge>{pageTitle}</HeadlineLarge>
                </PolicyHeader>
                <PolicyContent>{pageContent}</PolicyContent>
            </Body>
            <UnauthorizedFooter />
        </CompanyPolicyContainer>
    )
}

export default CompanyPolicyView
