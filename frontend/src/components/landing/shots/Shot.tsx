import { CSSProperties, ReactNode } from 'react'

type ShotProps = {
    variant: 'hero' | 'card'
    innerClassName: string
    style?: CSSProperties
    children: ReactNode
}

const Shot = ({ variant, innerClassName, style, children }: ShotProps) => (
    <div className={`shot shot--${variant}`} style={style} aria-hidden="true">
        <div className={`shot__inner ${innerClassName}`}>{children}</div>
    </div>
)

export default Shot
