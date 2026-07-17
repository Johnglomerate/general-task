import styled from 'styled-components'
import { Typography } from '../../styles'
import { mediaQuery } from '../../styles/dimensions'

// Only used by focus mode, so the phone size below is scoped to that screen.
const GTTitle = styled.div`
    ${Typography.headline.large}
    ${mediaQuery.phone} {
        ${Typography.title.large}
    }
`
export default GTTitle
