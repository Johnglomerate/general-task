import { useState } from 'react'
import { LOGIN_URL } from '../../constants'
import Logo from './Logo'

const Nav = () => {
    const [open, setOpen] = useState(false)
    const close = () => setOpen(false)

    return (
        <header className="nav" data-reveal>
            <div className="gt-container nav__inner">
                <Logo />
                <nav className={`nav__links${open ? ' is-open' : ''}`} id="navLinks">
                    <a href="#goals" target="_self" onClick={close}>
                        Goals
                    </a>
                    <a href="#features" target="_self" onClick={close}>
                        Features
                    </a>
                    <a href="#pricing" target="_self" onClick={close}>
                        Pricing
                    </a>
                </nav>
                <div className="nav__actions">
                    <a className="nav__login" href={LOGIN_URL} target="_self">
                        Log in
                    </a>
                    <a className="btn btn--primary btn--sm" href={LOGIN_URL} target="_self">
                        Get started
                    </a>
                    <button
                        className="nav__burger"
                        type="button"
                        aria-label="Menu"
                        aria-expanded={open}
                        aria-controls="navLinks"
                        onClick={() => setOpen((value) => !value)}
                    >
                        <span />
                        <span />
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Nav
