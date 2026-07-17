import styled, { css } from 'styled-components'
import { mediaQuery } from '../../../styles/dimensions'
import { noteBackground } from '../../../styles/images'

const background = css`
    background: url(${noteBackground});
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: top left, 0px 0px;
    background-size: cover;
`

export const BackgroundContainer = styled.div`
    ${background};
    /* 100% rather than 100vw: 100vw includes the scrollbar and pushes out a horizontal one. */
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    /* Scroll the document instead of this box, so mobile browsers can collapse their URL bar. */
    ${mediaQuery.phone} {
        height: auto;
        min-height: 100vh;
        overflow-y: visible;
    }
`
