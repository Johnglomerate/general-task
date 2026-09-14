import { useLayoutEffect, useRef } from 'react'
import { Colors, Typography } from '../../styles'
import { dayFrac, daysInYear, formatWeekLabel, yearStart } from './shots/goalsMock'
import { prefersReducedMotion } from './useLandingEffects'

const NS = 'http://www.w3.org/2000/svg'
const CX = 1540
const CY = 585
const R = 530
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const LINE = { arc: 0.9, arcO: 0.5, guide: 0.6, tick: 0.5, tickO: 0.28, month: 9, date: 7.5, sol: 7, sunR: 10 }
const INK = Colors.text.ink
const MUTED = '#8A8F86'
const PAGE = Colors.background.page
const YELLOW = Colors.accent.yellow
const MONO = Typography.fontFamily.mono

const pt = (f: number, r = R): [number, number] => [CX - Math.sin(f * Math.PI) * r, CY + Math.cos(f * Math.PI) * r]
const rot = (f: number) => (f - 0.5) * 180 - 90
const arcPath = (r: number) => {
    const [x1, y1] = pt(0, r)
    const [x2, y2] = pt(1, r)
    return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`
}

const el = (parent: Element, tag: string, attrs: Record<string, string | number>) => {
    const node = document.createElementNS(NS, tag)
    for (const key in attrs) node.setAttribute(key, String(attrs[key]))
    parent.appendChild(node)
    return node
}

type SundialProps = {
    onDateChange: (date: Date) => void
}

const Sundial = ({ onDateChange }: SundialProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const onDateChangeRef = useRef(onDateChange)
    onDateChangeRef.current = onDateChange

    useLayoutEffect(() => {
        const svg = svgRef.current
        if (!svg) return
        const reduce = prefersReducedMotion()
        const year = new Date().getFullYear()
        const start = yearStart()
        const days = daysInYear()
        const fracFor = (d: Date) => dayFrac(d)

        const defs = el(svg, 'defs', {})
        const gradient = el(defs, 'radialGradient', { id: 'sunGlow' })
        el(gradient, 'stop', { offset: '0%', 'stop-color': YELLOW, 'stop-opacity': 0.9 })
        el(gradient, 'stop', { offset: '45%', 'stop-color': YELLOW, 'stop-opacity': 0.35 })
        el(gradient, 'stop', { offset: '100%', 'stop-color': YELLOW, 'stop-opacity': 0 })
        const guideRadii = [R + 40, R - 28]
        guideRadii.forEach((r, i) =>
            el(svg, 'path', {
                d: arcPath(r),
                stroke: INK,
                'stroke-width': LINE.guide,
                opacity: i ? 0.18 : 0.12,
                fill: 'none',
            })
        )
        el(svg, 'path', {
            d: arcPath(R),
            stroke: INK,
            'stroke-width': LINE.arc,
            opacity: LINE.arcO,
            fill: 'none',
            'stroke-linecap': 'round',
        })
        el(svg, 'line', {
            x1: CX,
            y1: CY - R - 80,
            x2: CX,
            y2: CY + R + 80,
            stroke: INK,
            'stroke-width': 1,
            opacity: 0.25,
        })
        for (let w = 0; w <= 52; w++) {
            const f = w / 52
            const [x1, y1] = pt(f, R - 5)
            const [x2, y2] = pt(f, R + 5)
            el(svg, 'line', { x1, y1, x2, y2, stroke: INK, 'stroke-width': LINE.tick, opacity: LINE.tickO })
        }
        MONTHS.forEach((month, i) => {
            const f = fracFor(new Date(year, i, 1))
            const [x1, y1] = pt(f, R - 12)
            const [x2, y2] = pt(f, R + 12)
            el(svg, 'line', { x1, y1, x2, y2, stroke: INK, 'stroke-width': LINE.arc, opacity: 0.6 })
            const [tx, ty] = pt(f, R + 30)
            const monthLabel = el(svg, 'text', {
                x: tx,
                y: ty,
                'text-anchor': 'middle',
                'font-family': MONO,
                'font-size': LINE.month,
                fill: INK,
                opacity: 0.7,
                transform: `rotate(${rot(f)} ${tx} ${ty})`,
                'letter-spacing': '.08em',
            })
            monthLabel.textContent = month
            const [dx, dy] = pt(f, R - 42)
            const dateLabel = el(svg, 'text', {
                x: dx,
                y: dy,
                'text-anchor': 'middle',
                'font-family': MONO,
                'font-size': LINE.date,
                fill: MUTED,
                opacity: 0.8,
                transform: `rotate(${rot(f)} ${dx} ${dy})`,
            })
            dateLabel.textContent = `${month[0]}${month.slice(1).toLowerCase()} 1`
        })
        const markers = [
            [2, 20, 'EQUINOX'],
            [5, 21, 'SOLSTICE'],
            [8, 22, 'EQUINOX'],
            [11, 21, 'SOLSTICE'],
        ] as const
        markers.forEach(([m, d, label]) => {
            const f = fracFor(new Date(year, m, d))
            const [x, y] = pt(f, R)
            el(svg, 'circle', { cx: x, cy: y, r: 2.5, fill: PAGE, stroke: INK, 'stroke-width': 0.9, opacity: 0.7 })
            const [tx, ty] = pt(f, R + 56)
            const text = el(svg, 'text', {
                x: tx,
                y: ty,
                'text-anchor': 'middle',
                'font-family': MONO,
                'font-size': LINE.sol,
                fill: MUTED,
                opacity: 0.8,
                'letter-spacing': '.12em',
                transform: `rotate(${rot(f)} ${tx} ${ty})`,
            })
            text.textContent = label
        })
        el(svg, 'line', {
            x1: CX,
            y1: CY,
            x2: CX - 70,
            y2: CY,
            stroke: INK,
            'stroke-width': 1,
            opacity: 0.6,
            'stroke-linecap': 'round',
        })
        el(svg, 'circle', { cx: CX, cy: CY, r: 3, fill: INK, opacity: 0.7 })

        const ray = el(svg, 'line', {
            x1: CX,
            y1: CY,
            x2: CX,
            y2: CY,
            stroke: INK,
            'stroke-width': 0.75,
            opacity: 0.25,
            'stroke-dasharray': '3 4',
        })
        const glow = el(svg, 'circle', { r: 120, fill: 'url(#sunGlow)' })
        const halo = el(svg, 'circle', { r: 22, fill: YELLOW, opacity: 0.35 })
        const sun = el(svg, 'circle', { r: LINE.sunR, fill: YELLOW, stroke: INK, 'stroke-width': 1 })
        const label = el(svg, 'text', { 'font-family': MONO, 'font-size': 9.5, fill: INK, opacity: 0.85 })

        const today = new Date()
        const f0 = fracFor(today)
        let cur = f0
        let target = f0
        let raf = 0
        let lastDay = -1

        const place = (f: number) => {
            const [x, y] = pt(f)
            const day = Math.floor(f * days)
            if (day !== lastDay) {
                lastDay = day
                onDateChangeRef.current(new Date(year, 0, 1 + day))
            }
            glow.setAttribute('cx', String(x))
            glow.setAttribute('cy', String(y))
            halo.setAttribute('cx', String(x))
            halo.setAttribute('cy', String(y))
            sun.setAttribute('cx', String(x))
            sun.setAttribute('cy', String(y))
            ray.setAttribute('x2', String(x))
            ray.setAttribute('y2', String(y))
            const off = LINE.sunR + 14
            const lx = x - off + 4
            const ly = y + 6
            label.setAttribute('x', String(lx))
            label.setAttribute('y', String(ly))
            label.setAttribute('text-anchor', 'end')
            label.setAttribute('transform', `rotate(-90 ${lx} ${ly})`)
            const d = new Date(start.getTime() + f * days * 864e5)
            label.textContent = formatWeekLabel(d)
        }

        const tick = () => {
            cur += (target - cur) * 0.12
            place(cur)
            if (Math.abs(target - cur) > 1e-4) raf = requestAnimationFrame(tick)
            else raf = 0
        }

        const onScroll = () => {
            const hero = document.getElementById('hero')
            if (!hero) return
            const span = Math.max(1, hero.offsetHeight - window.innerHeight * 0.25)
            const p = Math.min(1, Math.max(0, window.scrollY / span))
            target = f0 + (1 - f0) * p
            if (!raf) raf = requestAnimationFrame(tick)
        }

        place(f0)
        if (!reduce) {
            window.addEventListener('scroll', onScroll, { passive: true })
            onScroll()
        }

        return () => {
            if (!reduce) window.removeEventListener('scroll', onScroll)
            if (raf) cancelAnimationFrame(raf)
            while (svg.firstChild) svg.removeChild(svg.firstChild)
        }
    }, [])

    return (
        <div className="sundial" aria-hidden="true">
            <svg ref={svgRef} viewBox="0 0 1440 1171" preserveAspectRatio="xMaxYMid slice" />
        </div>
    )
}

export default Sundial
