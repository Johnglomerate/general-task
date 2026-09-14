import { LOGIN_URL, SUBSCRIPTION_PRICE, SUBSCRIPTION_TRIAL_DAYS } from '../../constants'

const Closing = () => (
    <section className="closing" id="pricing">
        <div className="gt-container" data-reveal>
            <h2 className="closing__h">Start with one goal.</h2>
            <p>
                General Task is {SUBSCRIPTION_PRICE}, with a {SUBSCRIPTION_TRIAL_DAYS}-day free trial. Set a goal, give
                it an honest week, and watch the small things add up.
            </p>
            <div className="hero__ctas">
                <a className="btn btn--primary" href={LOGIN_URL} target="_self">
                    Start free trial
                </a>
                <a className="btn btn--secondary" href="#pricing" target="_self">
                    See pricing
                </a>
            </div>
        </div>
    </section>
)

export default Closing
