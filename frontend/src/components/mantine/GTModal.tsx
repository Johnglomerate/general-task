import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { mediaQuery } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import BaseModal, { BaseModalProps } from '../atoms/BaseModal'
import Flex from '../atoms/Flex'
import { Icon, TIconType } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import { BodySmall, BodySmallUpper, TitleMedium } from '../atoms/typography/Typography'

const SIDEBAR_WIDTH = '185px'
const MODAL_HEIGHT = '642px'

const ModalOuter = styled.div<{ fixedHeight: boolean }>`
    display: flex;
    height: ${({ fixedHeight }) => (fixedHeight ? MODAL_HEIGHT : '100%')};
    /* The sheet is already the height of the screen, and the sidebar becomes a tab strip above the
       content rather than a column beside it. */
    ${mediaQuery.phone} {
        flex-direction: column;
        height: 100%;
    }
`
const ModalContent = styled.div<{ smallGap: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1 0;
    gap: ${({ smallGap }) => (smallGap ? Spacing._16 : Spacing._24)};
    padding: ${Spacing._24} ${Spacing._32};
    overflow-y: auto;
    ${mediaQuery.phone} {
        flex: 1 1 auto;
        min-height: 0;
        padding: ${Spacing._16};
        padding-bottom: calc(${Spacing._16} + env(safe-area-inset-bottom));
    }
`
const ModalSidebar = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
    padding: ${Spacing._32} ${Spacing._12} ${Spacing._12};
    background-color: ${Colors.background.base};
    border-radius: ${Border.radius.medium} 0 0 ${Border.radius.medium};
    flex-basis: ${SIDEBAR_WIDTH};
    box-sizing: border-box;
    ${mediaQuery.phone} {
        flex-direction: row;
        flex: 0 0 auto;
        gap: ${Spacing._8};
        padding: ${Spacing._8};
        border-radius: 0;
        overflow-x: auto;
    }
`
const Link = styled.button<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._12};
    width: 100%;
    border-radius: ${Border.radius.medium};
    border: none;
    background-color: ${(props) => (props.isSelected ? Colors.background.hover : 'inherit')};
    color: ${Colors.text.black};
    gap: ${Spacing._12};
    cursor: pointer;
    ${mediaQuery.phone} {
        width: auto;
        flex: 0 0 auto;
        padding: ${Spacing._8} ${Spacing._12};
        white-space: nowrap;
    }
`
const MarginBottom8 = styled.div`
    margin-bottom: ${Spacing._8};
    /* ModalContent already shows the active tab's title on a phone. */
    ${mediaQuery.phone} {
        display: none;
    }
`

interface GTModalTab {
    title?: string
    subtitle?: string
    icon?: TIconType
    body: React.ReactNode
}
interface GTModalProps extends BaseModalProps {
    title?: string
    tabs: GTModalTab | GTModalTab[]
    defaultTabIndex?: number
}
const GTModal = ({ title, tabs, defaultTabIndex = 0, ...baseModalProps }: GTModalProps) => {
    const [selectedTab, setSelectedTab] = useState(defaultTabIndex)
    // if defaultTabIndex is updated, switch to that tab
    useEffect(() => {
        if (defaultTabIndex != null) {
            setSelectedTab(defaultTabIndex ?? 0)
        }
    }, [defaultTabIndex])

    const tab = Array.isArray(tabs) ? tabs[selectedTab] : tabs

    return (
        <BaseModal
            open={baseModalProps.open}
            onClose={baseModalProps.onClose}
            setIsModalOpen={baseModalProps.setIsModalOpen}
            size={baseModalProps.size}
        >
            <ModalOuter fixedHeight={Array.isArray(tabs)}>
                {Array.isArray(tabs) && (
                    <ModalSidebar>
                        <MarginBottom8>
                            <BodySmallUpper color="light">{title}</BodySmallUpper>
                        </MarginBottom8>
                        {tabs.map((tab, index) => (
                            <Link
                                key={tab.title}
                                isSelected={selectedTab === index}
                                onClick={() => setSelectedTab(index)}
                            >
                                <Icon icon={tab.icon || icons.arrow_right} color="black" />
                                <BodySmall>{tab.title}</BodySmall>
                            </Link>
                        ))}
                    </ModalSidebar>
                )}
                <ModalContent smallGap={!Array.isArray(tabs)}>
                    <Flex justifyContent="space-between" alignItems="center">
                        <TitleMedium>{tab.title}</TitleMedium>
                        <GTButton
                            styleType="icon"
                            tooltipText="Close"
                            icon={icons.x}
                            onClick={() => {
                                baseModalProps.setIsModalOpen(false)
                                baseModalProps.onClose?.()
                            }}
                        />
                    </Flex>
                    {tab.subtitle && <BodySmall color="light">{tab.subtitle}</BodySmall>}
                    {Array.isArray(tabs) && <Divider color={Colors.background.border} />}
                    <div>{tab.body}</div>
                </ModalContent>
            </ModalOuter>
        </BaseModal>
    )
}

export default GTModal
