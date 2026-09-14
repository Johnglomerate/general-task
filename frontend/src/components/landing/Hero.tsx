import { useState } from 'react'
import Sundial from './Sundial'
import GoalsShot from './shots/GoalsShot'

const Hero = () => {
    const [date, setDate] = useState(() => new Date())

    return (
        <section className="hero" id="hero">
            <div className="backdrop" aria-hidden="true">
                <div className="backdrop__wash" />
                <div className="blob blob--yellow" />
                <div className="blob blob--amber" />
                <div className="blob blob--pink" />
                <div className="blob blob--sky" />
                <div className="backdrop__fade" />
            </div>
            <Sundial onDateChange={setDate} />
            <div className="gt-container hero__inner">
                <div className="hero__copy">
                    <h1 data-stagger>Where your short-term tasks meet your long-term goals.</h1>
                    <p className="hero__sub" data-stagger>
                        General Task uses AI to break down your big goals into actionable, shorter-term actions, and
                        helps you keep track of your progress.
                    </p>
                </div>
                <div className="hero__shot" data-stagger>
                    <GoalsShot date={date} />
                </div>
            </div>
        </section>
    )
}

export default Hero
