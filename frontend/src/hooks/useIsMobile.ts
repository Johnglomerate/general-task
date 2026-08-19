import { BREAKPOINTS } from '../styles/dimensions'
import useWindowSize from './useWindowSize'

const useIsMobile = () => {
    const { width } = useWindowSize()
    return width < BREAKPOINTS.phone
}

export default useIsMobile
