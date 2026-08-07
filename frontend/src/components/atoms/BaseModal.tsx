import { Modal, ModalProps } from '@mantine/core'
import styled from 'styled-components'
import { useIsMobile } from '../../hooks'
import { Border, Colors, Shadows } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'

const ModalContentContainer = styled.div`
    height: 100%;
`
// Desktop widths. On a phone the modal goes full screen and these are ignored.
const MODAL_WIDTH = {
    sm: '625px',
    md: '720px',
    lg: '1004px',
}
type TModalSize = keyof typeof MODAL_WIDTH
export const GT_MODAL_ROOT_CLASS = 'gt-modal-root'

const getModalProps = (isMobile: boolean): Partial<ModalProps> => ({
    withCloseButton: false,
    centered: true,
    overlayColor: Colors.background.white,
    overlayOpacity: 0.55,
    overlayBlur: 3,
    transition: 'fade',
    transitionDuration: 150,
    padding: 0,
    onKeyDown: (e) => stopKeydownPropogation(e, [], true),
    classNames: {
        root: GT_MODAL_ROOT_CLASS,
    },
    styles: {
        modal: {
            // A full-screen sheet has no edges to round.
            borderRadius: isMobile ? 0 : Border.radius.medium,
            boxShadow: Shadows.deprecated_medium,
            overflow: 'hidden',
            // `dvh` so the sheet is not cut off by mobile Safari's collapsing toolbars.
            ...(isMobile && { maxHeight: '100dvh' }),
        },
    },
})

export interface BaseModalProps {
    children?: React.ReactNode
    size?: TModalSize
    open: boolean
    onClose?: () => void
    setIsModalOpen: (isModalOpen: boolean) => void
}
const BaseModal = ({ children, size = 'sm', open, onClose, setIsModalOpen }: BaseModalProps) => {
    const isMobile = useIsMobile()
    const onModalClose = () => {
        setIsModalOpen(false)
        onClose?.()
    }
    return (
        <Modal
            data-gt-modal-root
            opened={open}
            onClose={onModalClose}
            size={MODAL_WIDTH[size]}
            fullScreen={isMobile}
            {...getModalProps(isMobile)}
        >
            <ModalContentContainer>{children}</ModalContentContainer>
        </Modal>
    )
}

export default BaseModal
