import { logos } from '../../styles/images'

const Logo = () => (
    <a className="logo" href="/" target="_self">
        <img className="logo__mark" src={logos.generaltask_mark} alt="" />
        <span className="logo__word">General Task</span>
    </a>
)

export default Logo
