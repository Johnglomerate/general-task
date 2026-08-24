import { useEffect, useState } from 'react'
import { pointerFeature } from '../styles/dimensions'

// Whether the primary pointer can hover, the JS counterpart of `pointerQuery.canHover`. Use it for
// behavior a media query cannot reach — chiefly overlays that only a real pointer can ask for.
// Falls back to `true` where `matchMedia` is unavailable, so the desktop treatment stays the default.
const getCanHover = () => window.matchMedia?.(pointerFeature.canHover).matches ?? true

const useCanHover = () => {
    const [canHover, setCanHover] = useState(getCanHover)

    useEffect(() => {
        const query = window.matchMedia?.(pointerFeature.canHover)
        if (!query) return
        // Re-read on mount as well as on change: a phone plugged into a mouse, or a browser whose
        // first paint precedes the pointer being known, both flip this after the initial render.
        setCanHover(query.matches)
        const handleChange = (event: MediaQueryListEvent) => setCanHover(event.matches)
        query.addEventListener('change', handleChange)
        return () => query.removeEventListener('change', handleChange)
    }, [])

    return canHover
}

export default useCanHover
