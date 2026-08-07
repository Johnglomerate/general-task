import { forwardRef, memo } from 'react'
import styled from 'styled-components'
import { pointerQuery } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import { Icon } from './Icon'

const DominoContainer = styled.div<{ isVisible: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? '1' : '0')};
    /* The handle exists to advertise HTML5 drag-and-drop, which never fires on touch. Pinning it
       visible there would promise a gesture that cannot work, so hide it instead and let the
       equivalent context-menu and modal actions carry the affordance. */
    ${pointerQuery.noHover} {
        display: none;
    }
`
interface DominoProps {
    isVisible?: boolean
    className?: string
}
const Domino = forwardRef<HTMLDivElement, DominoProps>(({ isVisible = true, className }, ref) => {
    return (
        <DominoContainer isVisible={isVisible} className={className} ref={ref}>
            <Icon icon={icons.domino} color="gray" />
        </DominoContainer>
    )
})

export default memo(Domino)
