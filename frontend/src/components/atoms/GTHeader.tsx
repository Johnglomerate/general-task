import styled from 'styled-components'
import { Typography } from '../../styles'
import { mediaQuery } from '../../styles/dimensions'

// Only used by focus mode, so the phone size below is scoped to that screen.
const GTHeader = styled.div`
    ${Typography.display.medium}
    overflow: hidden;
    ${mediaQuery.phone} {
        ${Typography.headline.small}
    }
`
export default GTHeader
