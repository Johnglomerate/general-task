import { PRIVACY_POLICY_ROUTE, TERMS_OF_SERVICE_ROUTE } from '../../constants'
import Logo from './Logo'

const Footer = () => (
    <footer className="footer">
        <div className="gt-container">
            <div className="footer__cols">
                <div className="footer__brand">
                    <Logo />
                    <p className="mono">Daily planning that adds up to your goals.</p>
                </div>
                <div className="footer__col">
                    <b className="mono">Product</b>
                    <a href="#goals" target="_self">
                        Goals
                    </a>
                    <a href="#features" target="_self">
                        Calendar
                    </a>
                    <a href="#features" target="_self">
                        Focus Mode
                    </a>
                    <a href="#pricing" target="_self">
                        Pricing
                    </a>
                </div>
                <div className="footer__col">
                    <b className="mono">Resources</b>
                    <a href="#pricing" target="_self">
                        Pricing
                    </a>
                    <span>Help center</span>
                    <span>Changelog</span>
                    <span>Status</span>
                </div>
                <div className="footer__col">
                    <b className="mono">Company</b>
                    <span>Blog</span>
                    <span>About</span>
                    <a href={`/${PRIVACY_POLICY_ROUTE}`} target="_self">
                        Privacy Policy
                    </a>
                    <a href={`/${TERMS_OF_SERVICE_ROUTE}`} target="_self">
                        Terms of Service
                    </a>
                </div>
            </div>
            <div className="footer__legal mono">
                <span>© {new Date().getFullYear()} GENERAL TASK</span>
                <span>
                    <a href={`/${PRIVACY_POLICY_ROUTE}`} target="_self">
                        Privacy Policy
                    </a>
                    <a href={`/${TERMS_OF_SERVICE_ROUTE}`} target="_self">
                        Terms of Service
                    </a>
                </span>
            </div>
        </div>
    </footer>
)

export default Footer
