import styled from 'styled-components'
import { SUBSCRIPTION_PRICE } from '../../constants'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { LabelSmall } from '../atoms/typography/Typography'
import { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import Tip from '../radix/Tip'

const TrialContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._8};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    user-select: none;
`

const daysLeftText = (days: number) => (days === 1 ? '1 day left' : `${days} days left`)

interface TrialIndicatorProps {
    isCollapsed?: boolean
}
const TrialIndicator = ({ isCollapsed = false }: TrialIndicatorProps) => {
    const { data: userInfo } = useGetUserInfo()

    // is_in_trial is purely time-based, so hide the countdown from anyone already paying
    if (!userInfo?.is_in_trial || userInfo.is_subscribed) return null

    const daysRemaining = userInfo.trial_days_remaining ?? 0
    const tipContent = `${daysLeftText(daysRemaining)} in your free trial - ${SUBSCRIPTION_PRICE} after that`

    if (isCollapsed) {
        return (
            <Tip content={tipContent} side="right">
                <CollapsedIconContainer>
                    <Icon icon={icons.timer} color="gray" />
                </CollapsedIconContainer>
            </Tip>
        )
    }

    return (
        <Tip content={tipContent} side="right">
            <TrialContainer>
                <Icon icon={icons.timer} size="small" color="gray" />
                <LabelSmall color="muted">{`Free trial - ${daysLeftText(daysRemaining)}`}</LabelSmall>
            </TrialContainer>
        </Tip>
    )
}

export default TrialIndicator
