import { useEffect, useState } from 'react'

const getWindowSize = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
})

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState(getWindowSize)

    useEffect(() => {
        const handleResize = () => setWindowSize(getWindowSize())
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return windowSize
}

export default useWindowSize
