import { RefObject, useEffect, useLayoutEffect, useState } from 'react'

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCE_QUERY).matches

export const usePrefersReducedMotion = () => {
    const [reduce, setReduce] = useState(prefersReducedMotion)
    useEffect(() => {
        const query = window.matchMedia?.(REDUCE_QUERY)
        if (!query) return
        const onChange = () => setReduce(query.matches)
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])
    return reduce
}

export const useLandingEffects = (rootRef: RefObject<HTMLElement>) => {
    const reduce = usePrefersReducedMotion()

    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        let cancelled = false
        const timers: number[] = []
        const fillStrips = (target: Element) => {
            target.querySelectorAll('.strip i[data-on]').forEach((el, k) => {
                timers.push(
                    window.setTimeout(() => {
                        if (!cancelled) el.classList.add('on')
                    }, reduce ? 0 : 250 + k * 70)
                )
            })
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return
                    entry.target.classList.add('is-in')
                    fillStrips(entry.target)
                    io.unobserve(entry.target)
                })
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
        )
        root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))

        const stagger = root.querySelectorAll('[data-stagger]')
        stagger.forEach((el, i) => {
            ;(el as HTMLElement).style.setProperty('--delay', `${reduce ? 0 : 0.08 + i * 0.09}s`)
        })
        let raf2 = 0
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                stagger.forEach((el) => el.classList.add('is-in'))
            })
        })

        return () => {
            cancelled = true
            timers.forEach((id) => window.clearTimeout(id))
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
            io.disconnect()
        }
    }, [rootRef, reduce])

    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        const fit = () => {
            root.querySelectorAll('.shot').forEach((shot) => {
                const inner = shot.querySelector('.shot__inner') as HTMLElement | null
                if (!inner || !inner.offsetWidth) return
                inner.style.transform = `scale(${shot.clientWidth / inner.offsetWidth})`
            })
        }
        const ro = new ResizeObserver(fit)
        ro.observe(root)
        fit()
        return () => ro.disconnect()
    }, [rootRef])
}
