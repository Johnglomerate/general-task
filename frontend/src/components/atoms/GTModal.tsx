import { ReactElement } from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { useIsMobile } from '../../hooks'
import { Border, Colors, Dimensions, Shadows, Spacing, Typography } from '../../styles'
import { TModalSize, mediaQuery } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import { Icon } from './Icon'
import NoStyleButton from './buttons/NoStyleButton'

Modal.setAppElement('#root')

const ModalContainer = styled.div<{ type: TModalSize }>`
    min-height: ${(props) => Dimensions.modalSize[props.type].min_height};
    max-height: ${(props) => Dimensions.modalSize[props.type].max_height};
    box-sizing: border-box;
    display: flex;
    flex: auto;
    flex-direction: column;
    justify-content: space-between;
    /* The sheet owns the whole screen, so the desktop size tokens have to get out of the way. */
    ${mediaQuery.phone} {
        min-height: 0;
        max-height: none;
        height: 100%;
    }
`
const Header = styled.div`
    color: ${Colors.text.black};
    margin-bottom: ${Spacing._16};
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${Typography.headline.large};
`
const Body = styled.div`
    overflow-y: auto;
    overflow-x: hidden;
    padding: ${Spacing._16};
    display: flex;
    flex-direction: column;
    flex: 1;
`
const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: ${Spacing._8};
`
const CloseButton = styled(NoStyleButton)`
    padding: ${Spacing._8};
    border-radius: ${Border.radius.medium};
    &:hover {
        background-color: ${Colors.background.hover};
    }
`
const ButtonsGroup = styled.div`
    display: flex;
    gap: ${Spacing._8};
`

const SHARED_MODAL_CONTENT_STYLE = {
    margin: 'auto',
    border: 'none',
    height: 'fit-content',
    boxShadow: Shadows.deprecated_medium,
    padding: Spacing._16,
    borderRadius: Border.radius.medium,
}

// react-modal only takes inline styles, so the phone sheet cannot be expressed as a media query
// here the way it is on ModalContainer above.
const MOBILE_MODAL_CONTENT_STYLE = {
    ...SHARED_MODAL_CONTENT_STYLE,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 0,
    width: 'auto',
    height: 'auto',
    minHeight: 0,
    maxHeight: 'none',
    borderRadius: 0,
    paddingBottom: `calc(${Spacing._16} + env(safe-area-inset-bottom))`,
}

const getModalStyle = (modalSize: TModalSize, isMobile: boolean): Modal.Styles => ({
    overlay: {
        zIndex: 1000,
    },
    content: isMobile
        ? MOBILE_MODAL_CONTENT_STYLE
        : {
              ...SHARED_MODAL_CONTENT_STYLE,
              maxHeight: Dimensions.modalSize[modalSize].max_height,
              minHeight: Dimensions.modalSize[modalSize].min_height,
              width: Dimensions.modalSize[modalSize].width,
          },
})

interface GTModalProps {
    children?: React.ReactNode
    type: TModalSize
    title?: string
    leftButtons?: ReactElement | ReactElement[]
    rightButtons?: ReactElement | ReactElement[]
    isOpen: boolean
    canClose?: boolean
    shouldCloseOnOverlayClick?: boolean
    onClose?: () => void
}
const GTModal = (props: GTModalProps) => {
    const isMobile = useIsMobile()
    const handleClose = () => {
        if (props.onClose) {
            props.onClose()
        }
    }
    const shouldCloseOverlay = props.shouldCloseOnOverlayClick ?? true
    return (
        // ignoring TS warning here because react-modal typing does not support react 18, even though the library does
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        <Modal
            isOpen={props.isOpen}
            style={getModalStyle(props.type, isMobile)}
            onRequestClose={handleClose}
            shouldCloseOnOverlayClick={shouldCloseOverlay}
        >
            <ModalContainer type={props.type}>
                <Header>
                    <div>{props.title}</div>
                    {props.canClose && (
                        <CloseButton onClick={handleClose}>
                            <Icon icon={icons.x} />
                        </CloseButton>
                    )}
                </Header>
                {props.children && <Body>{props.children}</Body>}
                <Footer>
                    {props.leftButtons && <ButtonsGroup>{props.leftButtons}</ButtonsGroup>}
                    {props.rightButtons && <ButtonsGroup>{props.rightButtons}</ButtonsGroup>}
                </Footer>
            </ModalContainer>
        </Modal>
    )
}

export default GTModal
